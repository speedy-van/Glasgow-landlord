import SwiftUI
import UIKit
import WebKit
import Combine

@MainActor
final class WorkspaceModel: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate {
    let homeURL: URL
    let webView: WKWebView
    @Published var progress = 0.0
    @Published var isLoading = true
    @Published var errorMessage: String?
    private var observations: [NSKeyValueObservation] = []

    override init() {
        let configuredURL = Bundle.main.object(forInfoDictionaryKey: "WorkspaceURL") as? String
        let fallbackURL = URL(string: "https://glasgow-landlord.vercel.app/admin")!
        if let configured = configuredURL.flatMap({ URL(string: $0) }),
           configured.scheme?.lowercased() == "https",
           configured.host != nil,
           configured.user == nil,
           configured.password == nil {
            homeURL = configured
        } else {
            homeURL = fallbackURL
        }
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.applicationNameForUserAgent = "LandlordSolutionsAdmin/1.0"
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.isOpaque = false
        let cream = UIColor(red: 246/255, green: 243/255, blue: 236/255, alpha: 1)
        webView.backgroundColor = cream
        webView.scrollView.backgroundColor = cream
        observations = [
            webView.observe(\.estimatedProgress, options: [.new]) { [weak self] _, change in
                guard let progress = change.newValue else { return }
                Task { @MainActor [weak self] in self?.progress = progress }
            },
            webView.observe(\.isLoading, options: [.new]) { [weak self] _, change in
                guard let isLoading = change.newValue else { return }
                Task { @MainActor [weak self] in self?.isLoading = isLoading }
            }
        ]
        openWorkspace()
    }

    // NSKeyValueObservation invalidates automatically when its token is released.
    // The callbacks hold self weakly, so the tokens are released with this model.

    func openWorkspace() {
        errorMessage = nil
        webView.load(URLRequest(url: homeURL))
    }

    func retry() {
        errorMessage = nil
        if webView.url == nil { openWorkspace() } else { webView.reload() }
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        errorMessage = nil
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        record(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        record(error)
    }

    private func record(_ error: Error) {
        guard (error as NSError).code != NSURLErrorCancelled else { return }
        errorMessage = "We could not open your workspace. Check your connection and try again."
        isLoading = false
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == "about", url.absoluteString == "about:blank", action.targetFrame?.isMainFrame == false {
            decisionHandler(.allow)
            return
        }
        if isWorkspaceURL(url) {
            // The deployed site's own sign-in redirects retain the protected
            // session in the default WebKit data store.
            decisionHandler(.allow)
            return
        }
        if action.targetFrame?.isMainFrame != false, canOpenExternally(url) {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard navigationAction.targetFrame == nil, let url = navigationAction.request.url else { return nil }
        if isWorkspaceURL(url) { webView.load(navigationAction.request) }
        else if canOpenExternally(url) { UIApplication.shared.open(url) }
        return nil
    }

    private func isWorkspaceURL(_ url: URL) -> Bool {
        url.scheme?.lowercased() == "https"
            && url.host?.lowercased() == homeURL.host?.lowercased()
            && (url.port ?? 443) == (homeURL.port ?? 443)
            && url.user == nil
            && url.password == nil
    }

    private func canOpenExternally(_ url: URL) -> Bool {
        let scheme = url.scheme?.lowercased() ?? ""
        return ["tel", "mailto"].contains(scheme)
            || (scheme == "https" && url.host != nil && url.user == nil && url.password == nil)
    }
}

@MainActor
struct WorkspaceWebView: UIViewRepresentable {
    @ObservedObject var model: WorkspaceModel
    func makeUIView(context: Context) -> WKWebView { model.webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

@MainActor
struct WorkspaceView: View {
    @StateObject private var model = WorkspaceModel()
    private let forest = Color(red: 37/255, green: 61/255, blue: 53/255)
    private let cream = Color(red: 246/255, green: 243/255, blue: 236/255)
    private let brass = Color(red: 182/255, green: 154/255, blue: 115/255)

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                Image(systemName: "building.2").foregroundStyle(brass).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Landlord").font(.system(size: 15, weight: .semibold))
                    Text("Administration").font(.system(size: 11))
                }
                .foregroundStyle(.white)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("Landlord Solutions administration")
                Spacer()
                Button { model.openWorkspace() } label: { Image(systemName: "house").frame(width: 44, height: 44) }
                    .accessibilityLabel("Open workspace home")
                Button { model.retry() } label: { Image(systemName: "arrow.clockwise").frame(width: 44, height: 44) }
                    .accessibilityLabel("Refresh workspace")
                ShareLink(item: model.homeURL) { Image(systemName: "square.and.arrow.up").frame(width: 44, height: 44) }
                    .accessibilityLabel("Share workspace link")
            }
            .buttonStyle(.plain)
            .foregroundStyle(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(forest)

            if model.isLoading {
                ProgressView(value: model.progress).tint(brass).accessibilityLabel("Loading workspace")
            }

            ZStack {
                WorkspaceWebView(model: model)
                if let message = model.errorMessage {
                    VStack(spacing: 20) {
                        Image(systemName: "wifi.exclamationmark").font(.system(size: 34)).foregroundStyle(forest)
                        Text("Let’s try that again.").font(.title2.weight(.medium))
                        Text(message).font(.body).multilineTextAlignment(.center).foregroundStyle(.secondary)
                        Button("Try again") { model.retry() }.buttonStyle(.borderedProminent).tint(forest)
                        Link("Open in Safari", destination: model.homeURL).font(.footnote)
                    }
                    .padding(32)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(cream)
                }
            }
        }
        .background(forest.ignoresSafeArea(edges: .top))
        .background(cream.ignoresSafeArea(edges: .bottom))
        .preferredColorScheme(.light)
    }
}
