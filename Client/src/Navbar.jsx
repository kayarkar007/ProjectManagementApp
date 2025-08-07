// React aur uske kuch hooks import kar rahe hain
import React, {
  useState, // state banane ke liye
  useCallback, // function ko memoize karne ke liye
  useMemo, // value ko memoize karne ke liye
  useEffect, // side effects ke liye
  useRef, // reference banane ke liye
} from "react";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Navigation links ka array, har ek object ek link ko represent karta hai
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" }, // Dashboard page ka link
  { href: "/projects", label: "Projects" }, // Projects page ka link
  { href: "/tasks", label: "Tasks" }, // Tasks page ka link
  { href: "/users", label: "Users" }, // Users page ka link
  { href: "/reports", label: "Reports" }, // Reports page ka link
  { href: "/settings", label: "Settings" }, // Settings page ka link
];

// Navbar component define kar rahe hain
const Navbar = () => {
  // menuOpen: mobile menu open hai ya nahi, isDesktop: screen desktop size hai ya nahi
  const [menuOpen, setMenuOpen] = useState(false); // menuOpen ka initial value false hai
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024); // isDesktop ka initial value window ki width se decide hota hai
  const menuRef = useRef(null); // menuRef ek reference banata hai mobile menu overlay ke liye
  const { user, logout } = useAuth(); // Authentication context se user aur logout function
  const navigate = useNavigate(); // Navigation ke liye

  // Responsive handler: jab window resize ho to isDesktop aur menuOpen ko update karo
  useEffect(() => {
    // handleResize function window ki width check karta hai
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024); // agar width 1024 ya usse zyada hai to isDesktop true
      if (window.innerWidth >= 1024) setMenuOpen(false); // desktop pe menuOpen ko false kar do
    };
    window.addEventListener("resize", handleResize); // resize event pe handleResize call karo
    return () => window.removeEventListener("resize", handleResize); // cleanup: event listener hata do
  }, []);

  // Mobile menu ke liye: agar menu open hai aur user bahar click kare to menu band ho jaye
  useEffect(() => {
    if (!menuOpen) return; // agar menu open nahi hai to kuch mat karo
    // handleClick: agar click menu ke bahar hua to menu band karo
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick); // mousedown pe handleClick call karo
    return () => document.removeEventListener("mousedown", handleClick); // cleanup: event listener hata do
  }, [menuOpen]);

  // toggleMenu: menuOpen ko toggle karta hai (true/false)
  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  // handleLogout: logout function ko handle karta hai
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/initialpage"); // Redirect to InitialPage.jsx route after logout
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout, navigate]);

  // Navigation links ko render karne ke liye useMemo ka use kiya hai
  const renderLinks = useMemo(
    () =>
      NAV_LINKS.map(({ href, label }) => (
        <li key={href} className="flex-1 min-w-0">
          <a
            href={href}
            className="block w-full truncate px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white text-center transition-all duration-200 m-auto font-medium"
            tabIndex={menuOpen || isDesktop ? 0 : -1} // agar menu open hai ya desktop hai to tabIndex 0, warna -1
          >
            {label}
          </a>
        </li>
      )),
    [menuOpen, isDesktop] // menuOpen ya isDesktop change ho to links dobara render ho
  );

  // UserProfile component: user ki info aur avatar dikhata hai
  const UserProfile = ({ className = "" }) => (
    <div className={`user flex items-center gap-3 ${className}`}>
      <img
        src={user?.avatar || "./download (1).jpg"}
        alt="User avatar"
        className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-md"
        loading="lazy"
      />
      <div className="flex flex-col text-left">
        <span className="truncate max-w-[120px] font-semibold text-base text-white">
          {user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.username || "User"}
        </span>
        <span className="text-xs text-blue-300 capitalize">
          {user?.role || "user"}
        </span>
      </div>
    </div>
  );

  // LogoutButton component: logout button dikhata hai
  const LogoutButton = ({ className = "" }) => (
    <button
      className={`logout bg-gradient-to-r from-red-500 to-pink-500 px-5 py-2 rounded-lg text-white font-semibold shadow-md hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200 ${className}`}
      type="button"
      aria-label="Logout"
      onClick={handleLogout}
    >
      Logout
    </button>
  );

  // overlayInert: agar menu open nahi hai to overlay inert ho jata hai (inactive)
  const overlayInert = !menuOpen;

  // Navbar ka main JSX return ho raha hai
  return (
    <nav className="w-full fixed top-0 left-0 text-white z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
      {/* Container div: navbar ke andar sab kuch isme hai */}
      <div className="container mx-auto max-w-[1400px] px-4 py-0 flex items-center justify-evenly h-20 relative">
        {/* Logo section */}
        <a
          href="/dashboard"
          className="flex items-center gap-3 group transition-all duration-200"
          aria-label="Project Management Home"
        >
          {/* Logo ka icon */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="14" width="7" height="7" rx="2" />
              <rect x="3" y="14" width="7" height="7" rx="2" />
            </svg>
          </div>
          {/* Logo ka text */}
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-wide leading-tight text-white">
              Project<span className="text-blue-400">Flow</span>
            </span>
            <span className="text-xs text-gray-400 tracking-wide">
              Management System
            </span>
          </div>
        </a>

        {/* Hamburger button: mobile/tablet pe menu open/close karne ke liye */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={toggleMenu} // button click pe menu open/close hota hai
            className="focus:outline-none p-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
            aria-label={menuOpen ? "Close menu" : "Open menu"} // accessibility ke liye
            tabIndex={0}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Agar menu open hai to cross icon, warna hamburger icon */}
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8h16M4 16h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop ke liye navigation links */}
        <div className="hidden lg:flex flex-2 justify-center items-center  w-auto">
          <ul className="flex w-[90%] gap-2 xl:gap-4  items-center">
            {renderLinks}
          </ul>
        </div>

        {/* Desktop pe user profile aur logout button */}
        <div className="hidden lg:flex items-center gap-6 min-w-[220px] justify-end ">
          <UserProfile />
          <LogoutButton />
        </div>

        {/* Mobile menu overlay: jab menuOpen true ho to dikhata hai */}
        <div
          ref={menuRef} // menuRef se reference milta hai
          className={`fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-300 ${
            menuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          } lg:hidden`}
          inert={overlayInert} // agar menu open nahi hai to overlay inert ho jata hai
        >
          {/* Mobile menu ka nav */}
          <nav
            className={`absolute top-0 right-0 w-4/5 max-w-xs h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl transform transition-transform duration-300 ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            } flex flex-col`}
            role="menu"
            aria-label="Mobile Navigation"
          >
            {/* Mobile menu ka header: logo aur close button */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="14" width="7" height="7" rx="2" />
                    <rect x="3" y="14" width="7" height="7" rx="2" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">
                  ProjectFlow
                </span>
              </div>
              {/* Close button for mobile menu */}
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
                aria-label="Close menu"
              >
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {/* Mobile menu ke navigation links */}
            <ul className="flex flex-col gap-1 px-6 py-4">{renderLinks}</ul>
            {/* Mobile menu ke bottom me user profile aur logout button */}
            <div className="mt-auto px-6 py-6 border-t border-gray-700 flex flex-col gap-4">
              <UserProfile className="w-auto" />
              <LogoutButton />
            </div>
          </nav>
        </div>
      </div>
    </nav>
  );
};

// Navbar component ko export kar rahe hain taki dusre files me use ho sake
export default Navbar;
