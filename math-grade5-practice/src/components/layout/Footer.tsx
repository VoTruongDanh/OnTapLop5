export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo and Description */}
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-xl">🧮</span>
            <span className="font-medium">Toán Lớp 5</span>
            <span className="hidden sm:inline text-gray-400">|</span>
            <span className="hidden sm:inline text-sm">Ôn tập theo chương trình Việt Nam</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <a href="/about" className="hover:text-blue-600 transition-colors">
              Giới thiệu
            </a>
            <a href="/help" className="hover:text-blue-600 transition-colors">
              Hướng dẫn
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-400">
            © {currentYear} Toán Lớp 5
          </div>
        </div>
      </div>
    </footer>
  );
}
