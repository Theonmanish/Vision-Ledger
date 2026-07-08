import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center group">
              <img
                src="/logo.svg"
                alt="VisionLedger"
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              Proof of Reality in an AI-Generated World. Verify claims with AI analysis and
              blockchain-backed records.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Product</h4>
            <ul className="space-y-2">
              {[
                { label: 'Verify Evidence', path: '/verify' },
                { label: 'History', path: '/history' },
                { label: 'How It Works', path: '/#how-it-works' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-sm text-muted hover:text-foreground transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Features</h4>
            <ul className="space-y-2">
              {[
                'AI Analysis',
                'Blockchain Records',
                'Certificate Generation',
                'Real-time Dashboard',
              ].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted hover:text-foreground transition-colors duration-200 cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border/50 text-center">
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} VisionLedger. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
