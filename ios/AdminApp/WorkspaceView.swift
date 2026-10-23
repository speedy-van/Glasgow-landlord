import SwiftUI
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
        homeURL = URL(string: configuredURL ?? "https://landlord-interiors-studio.rosymug130.chatgpt.site/admin")!
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.applicationNameForUserAgent = "FurnishingAdmin/1.0"
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 247/255, green: 245/255, blue: 239/255, alpha: 1)
        observations = [
            webView.observe(\.estimatedProgress, options: [.new]) { [weak self] view, _ in
                Task { @MainActor [weak self] in self?.progress = view.estimatedProgress }
            },
            webView.observe(\.isLoading, options: [.new]) { [weak self] view, _ in
                Task { @MainActor [weak self] in self?.isLoading = view.isLoading }
            }
        ]
        openWorkspace()
    }

    deinit { observations.forEach { $0.invalidate() } }

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
        if ["tel", "mailto"].contains(url.scheme?.lowercased() ?? "") {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        guard ["https", "about"].contains(url.scheme?.lowercased() ?? "") else {
            decisionHandler(.cancel)
            return
        }
        // Authentication redirects stay in the web view so its protected session is retained.
        let host = url.host?.lowercased() ?? ""
        let isAuthenticationHost = host == "chatgpt.com" || host.hasSuffix(".chatgpt.com") || host == "openai.com" || host.hasSuffix(".openai.com")
        if action.navigationType == .linkActivated, url.host != homeURL.host, !isAuthenticationHost {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard navigationAction.targetFrame == nil, let url = navigationAction.request.url else { return nil }
        if url.host == homeURL.host || url.host == "chatgpt.com" || (url.host?.hasSuffix(".openai.com") ?? false) { webView.load(navigationAction.request) }
        else if url.scheme == "https" { UIApplication.shared.open(url) }
        return nil
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
    private let forest = Color(red: 32/255, green: 59/255, blue: 48/255)
    private let cream = Color(red: 247/255, green: 245/255, blue: 239/255)

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: "key.fill").foregroundStyle(Color(red: 215/255, green: 189/255, blue: 136/255))
                Text("Your workspace").font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                Spacer()
                Button { model.openWorkspace() } label: { Image(systemName: "house") }
                    .accessibilityLabel("Open workspace home")
                Button { model.retry() } label: { Image(systemName: "arrow.clockwise") }
                    .accessibilityLabel("Refresh workspace")
                ShareLink(item: model.homeURL) { Image(systemName: "square.and.arrow.up") }
                    .accessibilityLabel("Share workspace link")
            }
            .buttonStyle(.plain)
            .foregroundStyle(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .background(forest)

            if model.isLoading {
                ProgressView(value: model.progress).tint(Color(red: 155/255, green: 121/255, blue: 63/255))
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
