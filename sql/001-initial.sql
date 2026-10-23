CREATE TABLE IF NOT EXISTS products (
 id text PRIMARY KEY, slug text UNIQUE NOT NULL, title text NOT NULL, category text NOT NULL CHECK(category IN ('Living room','Bedroom','Dining','Appliances')),
 description text NOT NULL, finish text NOT NULL DEFAULT '', price_pence integer CHECK(price_pence>0), stock integer CHECK(stock>=0), reserved integer NOT NULL DEFAULT 0 CHECK(reserved>=0),
 images jsonb NOT NULL, active boolean NOT NULL DEFAULT false, featured boolean NOT NULL DEFAULT false, version integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(stock IS NULL OR reserved<=stock)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS site_settings (id integer PRIMARY KEY CHECK(id=1), data jsonb NOT NULL, version integer NOT NULL DEFAULT 0);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS media (id text PRIMARY KEY, url text NOT NULL, name text NOT NULL, alt text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS quotes (id uuid PRIMARY KEY, request_id uuid UNIQUE NOT NULL, data jsonb NOT NULL, status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','quoted','closed')), created_at timestamptz NOT NULL DEFAULT now());
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS orders (
 id uuid PRIMARY KEY, request_id uuid UNIQUE NOT NULL, email text NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','processing','dispatched','delivered','expired')),
 items jsonb NOT NULL, subtotal_pence integer NOT NULL, delivery_pence integer NOT NULL, total_pence integer NOT NULL, stripe_session_id text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), checkout_expires_at timestamptz NOT NULL DEFAULT (now()+interval '60 minutes')
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS stripe_events (id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL DEFAULT now(), count integer NOT NULL DEFAULT 1);
-- statement-breakpoint
CREATE OR REPLACE FUNCTION reserve_order(p_id uuid,p_request uuid,p_email text,p_items jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE existing orders%ROWTYPE; item jsonb; product products%ROWTYPE; lines jsonb:='[]'::jsonb; subtotal integer:=0; delivery integer; qty integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 SELECT * INTO existing FROM orders WHERE request_id=p_request;
 IF FOUND THEN RETURN to_jsonb(existing); END IF;
 SELECT (data->>'deliveryFeePence')::integer INTO delivery FROM site_settings WHERE id=1 AND (data->>'paymentsEnabled')::boolean=true;
 IF delivery IS NULL THEN RAISE EXCEPTION 'Checkout is not available'; END IF;
 IF jsonb_array_length(p_items)<1 OR jsonb_array_length(p_items)>30 THEN RAISE EXCEPTION 'Invalid basket'; END IF;
 IF (SELECT count(DISTINCT v->>'productId') FROM jsonb_array_elements(p_items) v)<>jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Duplicate product'; END IF;
 FOR item IN SELECT v FROM jsonb_array_elements(p_items) v ORDER BY v->>'productId' LOOP
  qty:=(item->>'quantity')::integer;
  IF qty<1 OR qty>50 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  SELECT * INTO product FROM products WHERE id=item->>'productId' FOR UPDATE;
  IF NOT FOUND OR NOT product.active OR product.price_pence IS NULL OR product.stock IS NULL OR product.stock-product.reserved<qty THEN RAISE EXCEPTION 'Product unavailable'; END IF;
  UPDATE products SET reserved=reserved+qty,version=version+1,updated_at=now() WHERE id=product.id;
  subtotal:=subtotal+product.price_pence*qty;
  lines:=lines||jsonb_build_array(jsonb_build_object('productId',product.id,'title',product.title,'quantity',qty,'pricePence',product.price_pence,'image',product.images->>0));
 END LOOP;
 INSERT INTO orders(id,request_id,email,items,subtotal_pence,delivery_pence,total_pence) VALUES(p_id,p_request,p_email,lines,subtotal,delivery,subtotal+delivery) RETURNING * INTO existing;
 RETURN to_jsonb(existing);
END $$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION apply_stripe_event(p_event text,p_order uuid,p_session text,p_type text,p_amount integer,p_currency text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE current_order orders%ROWTYPE; item jsonb; added integer;
BEGIN
 INSERT INTO stripe_events(id) VALUES(p_event) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS added=ROW_COUNT;
 IF added=0 THEN RETURN false; END IF;
 SELECT * INTO current_order FROM orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR current_order.stripe_session_id IS DISTINCT FROM p_session THEN RAISE EXCEPTION 'Order session mismatch'; END IF;
 IF current_order.status<>'pending' THEN RETURN false; END IF;
 IF p_type='paid' AND (p_amount IS DISTINCT FROM current_order.total_pence OR p_currency IS DISTINCT FROM 'gbp') THEN RAISE EXCEPTION 'Payment total mismatch'; END IF;
 FOR item IN SELECT v FROM jsonb_array_elements(current_order.items) v ORDER BY v->>'productId' LOOP
  UPDATE products SET reserved=reserved-(item->>'quantity')::integer, stock=CASE WHEN p_type='paid' THEN stock-(item->>'quantity')::integer ELSE stock END,version=version+1,updated_at=now() WHERE id=item->>'productId';
 END LOOP;
 UPDATE orders SET status=CASE WHEN p_type='paid' THEN 'paid' ELSE 'expired' END WHERE id=p_order;
 RETURN true;
END $$;

-- statement-breakpoint
CREATE OR REPLACE FUNCTION expire_unopened_order(p_order uuid) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE current_order orders%ROWTYPE; item jsonb;
BEGIN
 SELECT * INTO current_order FROM orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR current_order.status<>'pending' OR current_order.stripe_session_id IS NOT NULL THEN RETURN false; END IF;
 FOR item IN SELECT v FROM jsonb_array_elements(current_order.items) v ORDER BY v->>'productId' LOOP
  UPDATE products SET reserved=reserved-(item->>'quantity')::integer,version=version+1,updated_at=now() WHERE id=item->>'productId';
 END LOOP;
 UPDATE orders SET status='expired' WHERE id=p_order;
 RETURN true;
END $$;
