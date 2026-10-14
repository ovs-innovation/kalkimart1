import { useContext, useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCart } from "react-use-cart";
import { IoSearchOutline, IoClose } from "react-icons/io5";
import { FiShoppingCart, FiHeart, FiUser } from "react-icons/fi";
import { FaPrescriptionBottleAlt } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";

import { getUserSession } from "@lib/auth";
import useWishlist from "@hooks/useWishlist";
import useGetSetting from "@hooks/useGetSetting";
import useUtilsFunction from "@hooks/useUtilsFunction";
import CartDrawer from "@components/drawer/CartDrawer";
import { SidebarContext } from "@context/SidebarContext";
import CategoryServices from "@services/CategoryServices";
import SearchSuggestions from "@components/search/SearchSuggestions";
import LowerCategoryNavbar from "./LowerCategoryNavbar";
import CustomerNotificationBell from "@components/notification/CustomerNotificationBell";
//import { pickBrandLogo } from "@utils/brandAssets";
import kalkimartlogo from "../../../public/logo/kalkimartlogo.png";

const NavbarLogo = () => {
  return (
    <Link href="/" className="flex items-center shrink-0 group" aria-label="kalkimart">
      <Image
        src={kalkimartlogo}
        alt="logo"
        width={130}
        height={65}
        priority
        className="object-contain transition-transform duration-300 group-hover:scale-105 brightness-0 invert"
        style={{ height: "54px", width: "auto" }}
      />
    </Link>
  );
};



const Navbar = () => {
  const { showingTranslateValue } = useUtilsFunction();
  const router = useRouter();
  const { data: categoriesData } = useQuery({
    queryKey: ["category"],
    queryFn: async () => await CategoryServices.getShowingCategory(),
  });

  const getLevel1Categories = (categories) => {
    if (!categories || !Array.isArray(categories) || categories.length === 0) return [];

    const homeRoot = categories.find(
      (cat) =>
        cat.id === "Root" ||
        showingTranslateValue(cat?.name)?.toLowerCase() === "home"
    );

    let topLevel = homeRoot?.children?.length ? homeRoot.children : categories;
    return topLevel;
  };

  const categories = getLevel1Categories(categoriesData);

  const { toggleCartDrawer } = useContext(SidebarContext);
  const { totalUniqueItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const userInfo = getUserSession();

  // Initialize from route to avoid "flash" on first paint.
  const initialShowSearch =
    router.pathname !== "/" || router.pathname === "/search";
  const [showSearchInNavbar, setShowSearchInNavbar] = useState(initialShowSearch);
  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  const isHome = router.pathname === "/";
  const showNavbarSearch =
    !isHome || showSearchInNavbar || router.pathname === "/search";

  useEffect(() => {
    if (!isHome) {
      setShowSearchInNavbar(true);
      return;
    }

    const onScroll = () => setShowSearchInNavbar(window.scrollY > 450);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome, router.asPath]);

  useEffect(() => {
    if (router.pathname === "/search" && router.query.query) {
      setSearchText(router.query.query);
    }
  }, [router.pathname, router.query.query]);

  const handleSearchChange = (value) => {
    setSearchText(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    setShowSuggestions(false);
    searchInputRef.current?.blur();
    if (trimmed) {
      router
        .push(
          { pathname: "/search", query: { query: trimmed } },
          `/search?query=${encodeURIComponent(trimmed)}`,
          { shallow: false }
        )
        .then(() => setSearchText(""))
        .catch(() => {
          window.location.href = `/search?query=${encodeURIComponent(trimmed)}`;
        });
    }
  };

  return (
    <>
      <CartDrawer />
      <header className="hidden lg:block glass-header">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-16">
          <div
            className={`flex items-center gap-4 transition-all duration-300 ${showNavbarSearch ? "py-2.5" : "py-2"
              }`}
          >
            <NavbarLogo />

            <div className="flex-1 min-w-0 flex items-center justify-center gap-2 relative z-50">

              {showNavbarSearch ? (
                <form
                  onSubmit={handleSearchSubmit}
                  className="navbar-search-form flex items-center w-full max-w-3xl rounded-full border border-neutral-800 bg-neutral-900/90 backdrop-blur-md p-1 hover:border-[#FED7AA]/40 focus-within:border-[#FED7AA]/60 transition-all"
                >
                  <div className="flex-1 relative min-w-0 flex items-center min-h-[42px]">
                    <IoSearchOutline className="absolute left-3 text-neutral-400 text-lg pointer-events-none z-10" />
                    <input
                      ref={searchInputRef}
                      type="search"
                      placeholder="What products or custom items are you looking for?"
                      className="navbar-search-input w-full h-full py-2 pl-10 pr-2 text-sm text-neutral-100 placeholder-neutral-500 !bg-transparent !border-0 !border-none !shadow-none !ring-0 !outline-none focus:!ring-0 focus:!border-0 focus:!outline-none"
                      value={searchText}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => searchText.length > 0 && setShowSuggestions(true)}
                      onBlur={(e) => {
                        const relatedTarget = e.relatedTarget;
                        const box = document.querySelector(".search-suggestions-container");
                        if (!relatedTarget || (box && !box.contains(relatedTarget))) {
                          setTimeout(() => {
                            const active = document.activeElement;
                            if (!box || !box.contains(active)) setShowSuggestions(false);
                          }, 200);
                        }
                      }}
                    />
                    <SearchSuggestions
                      searchText={searchText}
                      showSuggestions={showSuggestions}
                      onSelect={() => {
                        setSearchText("");
                        setShowSuggestions(false);
                      }}
                      onClose={() => setShowSuggestions(false)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="shrink-0 rounded-full bg-[#FED7AA] hover:bg-[#f6c888] text-neutral-900 text-sm font-bold px-5 py-2 border-0 outline-none shadow-md transition-all active:scale-[0.97]"
                  >
                    Search
                  </button>
                  {isHome && (
                    <button
                      type="button"
                      onClick={() => setShowSearchInNavbar(false)}
                      className="ml-1 p-1.5 text-neutral-400 hover:text-white rounded-full transition-colors shrink-0"
                      title="Close Search"
                    >
                      <IoClose className="text-xl" />
                    </button>
                  )}
                </form>
              ) : isHome ? (
                <LowerCategoryNavbar
                  variant="inline"
                  categories={categories}
                  showingTranslateValue={showingTranslateValue}
                />
              ) : null}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Search icon circle button — toggles search bar */}
              <button
                type="button"
                onClick={() => {
                  setShowSearchInNavbar((prev) => {
                    const next = !prev;
                    if (next) setTimeout(() => searchInputRef.current?.focus(), 60);
                    return next;
                  });
                }}
                className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all ${showNavbarSearch
                    ? "bg-[#FED7AA] text-neutral-900 border-[#FED7AA]"
                    : "border-neutral-700/80 hover:border-neutral-500 text-neutral-300 hover:text-white"
                  }`}
                aria-label="Toggle Search"
                title="Search"
              >
                <IoSearchOutline className="text-lg" />
              </button>

              <Link
                href="/wishlist"
                className="relative p-2 text-neutral-300 hover:text-white transition-colors"
                aria-label="Wishlist"
              >
                <FiHeart className="text-xl" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 text-[10px] font-bold text-white bg-neutral-800 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={toggleCartDrawer}
                className="relative p-2 text-neutral-300 hover:text-white transition-colors"
                aria-label="Cart"
              >
                <FiShoppingCart className="text-xl" />
                {totalUniqueItems > 0 ? (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 text-[10px] font-bold text-neutral-900 bg-[#FED7AA] rounded-full flex items-center justify-center px-1">
                    {totalUniqueItems}
                  </span>
                ) : (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 text-[10px] font-bold text-neutral-900 bg-[#FED7AA] rounded-full flex items-center justify-center px-1">
                    0
                  </span>
                )}
              </button>

              {userInfo && (
                <Link
                  href="/user/dashboard"
                  className="text-sm font-semibold text-neutral-300 hover:text-white transition-colors mx-2 whitespace-nowrap"
                >
                  My Account
                </Link>
              )}
              {userInfo?.image ? (
                <Link href="/user/dashboard">
                  <Image
                    width={36}
                    height={36}
                    src={userInfo.image}
                    alt="Account"
                    className="rounded-full w-9 h-9 border-2 border-neutral-700 object-cover"
                  />
                </Link>
              ) : userInfo?.name ? (
                <Link
                  href="/user/dashboard"
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-400 text-amber-300 font-bold text-sm"
                >
                  {userInfo.name[0]}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/auth/login")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f6c888] hover:bg-[#f6c888] text-neutral-900 font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm ml-1"
                >
                  <FiUser className="text-base text-neutral-900" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {showNavbarSearch && (
          <LowerCategoryNavbar
            variant="row"
            categories={categories}
            showingTranslateValue={showingTranslateValue}
          />
        )}
      </header>
      <style jsx global>{`
        .navbar-search-form .navbar-search-input {
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          --tw-ring-shadow: 0 0 #0000 !important;
        }
        .navbar-search-form .navbar-search-input:focus {
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
      `}</style>
    </>
  );
};

export default dynamic(() => Promise.resolve(Navbar), { ssr: false });
