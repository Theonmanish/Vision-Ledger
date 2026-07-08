import { Link } from 'react-router-dom';
import { Container } from '../ui/container';

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-white/[0.08] bg-[#09090B]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/30 to-transparent" />

      <Container className="py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center transition-opacity duration-200 hover:opacity-80">
              <img src="/logo.svg" alt="VisionLedger" className="h-8 w-auto" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/50">
              Proof of Reality in an AI-Generated World. Verify claims with AI analysis and
              blockchain-backed records.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-3">
              {[
                { label: 'Verify Evidence', path: '/verify' },
                { label: 'History', path: '/history' },
                { label: 'How It Works', path: '/#how-it-works' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-sm text-white/50 transition-colors duration-200 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Features</h4>
            <ul className="space-y-3">
              {[
                'AI Analysis',
                'Blockchain Records',
                'Certificate Generation',
                'Real-time Dashboard',
              ].map((item) => (
                <li key={item}>
                  <span className="text-sm text-white/50">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <li key={item}>
                  <span className="cursor-pointer text-sm text-white/50 transition-colors duration-200 hover:text-white">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/[0.08] pt-8 text-center">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} VisionLedger. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
