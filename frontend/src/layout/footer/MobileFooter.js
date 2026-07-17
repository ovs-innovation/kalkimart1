import React, { useContext, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCart } from "react-use-cart";
import { FiHome, FiUser, FiShoppingCart, FiAlignLeft, FiHeart } from "react-icons/fi";
import { IoSearchOutline, IoLockClosedOutline } from "react-icons/io5";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

//internal imports
import { getUserSession } from "@lib/auth";
import { SidebarContext } from "@context/SidebarContext";
import CategoryDrawer from "@components/drawer/CategoryDrawer";
import useGetSetting from "@hooks/useGetSetting";
import useWishlist from "@hooks/useWishlist";
import LocationButton from "@components/location/LocationButton";
import SearchSuggestions from "@components/search/SearchSuggestions";
import CustomerNotificationBell from "@components/notification/CustomerNotificationBell";
import kalkimartlogo from "../../../public/logo/kalkimartlogo.png";

const MobileFooter = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSignDropdown, setShowSignDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const { toggleCategoryDrawer, showSearch, setShowSearch } = useContext(SidebarContext);
  const userInfo = getUserSession();
  const router = useRouter();
  const { t } = useTranslation("common");
  const { storeCustomizationSetting } = useGetSetting();
  const storeColor = storeCustomizationSetting?.theme?.color || "green";

  const handleSearchChange = (value) => {
    setSearchText(value);
    setShowSuggestions(value.trim().length > 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmedSearchText = searchText.trim();
    setShowSuggestions(false);
    searchInputRef.current?.blur();

    if (trimmedSearchText) {
      router.push(
        {
          pathname: "/search",
          query: { query: trimmedSearchText },
        },
        `/search?query=${encodeURIComponent(trimmedSearchText)}`,
        { shallow: false }
      ).then(() => {
        setSearchText("");
        setShowSearch(false);
      }).catch((err) => {
        console.error("Navigation error:", err);
        window.location.href = `/search?query=${encodeURIComponent(trimmedSearchText)}`;
      });
    } else {
      router.push(`/`);
      setSearchText("");
      setShowSearch(false);
    }
  };

  return (
    <>
      {/* Drawer lives off-canvas; keep it mounted without forcing page layout/scroll */}
      <CategoryDrawer />
      <footer className="lg:hidden fixed z-[60] top-0 glass-header flex items-center justify-between w-full h-18 px-4 sm:px-6">
        {/* Left section: Drawer trigger + Logo */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Bar"
            onClick={toggleCategoryDrawer}
            className="flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors focus:outline-none"
          >
            <FiAlignLeft className="w-6 h-6" />
          </button>
          <Link
            href="/"
            className="flex items-center shrink-0 group ml-1"
            rel="noreferrer"
            aria-label="kalkimart"
          >
            <Image
              src={kalkimartlogo}
              alt="logo"
              width={120}
              height={150}
              priority
              className="object-contain ml-2 transition-transform duration-300 group-hover:scale-[1.03]"
              style={{ height: "80px", width: "auto" }}
            />
          </Link>
        </div>

        {/* Right section: Notification Bell + User Profile / Login */}
        <div className="flex items-center gap-3">
          <CustomerNotificationBell className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors" />
          
          <div className="flex items-center justify-center relative">
            {userInfo?.image ? (
              <Link href="/user/dashboard" className="relative w-8 h-8 block">
                <Image
                  width={32}
                  height={32}
                  src={userInfo.image}
                  alt="user"
                  className="rounded-full object-cover w-8 h-8 border-2 border-store-500 shadow-md"
                />
              </Link>
            ) : userInfo?.name ? (
              <Link
                href="/user/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-store-500 text-store-500 bg-store-500/10 font-bold text-sm hover:bg-store-500 hover:text-white transition-all duration-200"
              >
                {userInfo?.name[0].toUpperCase()}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="bg-store-500 hover:bg-store-600 text-white px-4 py-1.5 rounded-full flex items-center gap-2 font-bold text-xs shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                <IoLockClosedOutline className="text-sm" /> Login
              </Link>
            )}
          </div>
        </div>
      </footer>
      {showSearch && (
        <div className="fixed z-50 top-16 left-0 w-full bg-white px-3 py-2 shadow" style={{ overflow: 'visible' }}>
          <form
            onSubmit={handleSubmit}
            className="relative bg-white shadow-sm rounded-md w-full flex items-center overflow-visible"
          >
            {/* Location Button */}
            <LocationButton className="h-10 flex-shrink-0" />

            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                onChange={(e) => handleSearchChange(e.target.value)}
                value={searchText}
                type="text"
                placeholder="Search for medicine or store..."
                className="w-full pl-3 pr-12 appearance-none transition ease-in-out text-input text-sm font-sans rounded-md min-h-10 h-10 duration-200 bg-[#F3F4F6] focus:ring-2 focus:ring-store-500 outline-none border-none focus:outline-none placeholder-gray-500 placeholder-opacity-75"
                onFocus={() => searchText.trim().length > 0 && setShowSuggestions(true)}
                onBlur={(e) => {
                  const relatedTarget = e.relatedTarget;
                  const suggestionsContainer = document.querySelector('.search-suggestions-container');

                  if (!relatedTarget || (suggestionsContainer && !suggestionsContainer.contains(relatedTarget))) {
                    setTimeout(() => {
                      const activeElement = document.activeElement;
                      if (!suggestionsContainer || !suggestionsContainer.contains(activeElement)) {
                        setShowSuggestions(false);
                      }
                    }, 200);
                  }
                }}
              />
              <button
                aria-label="Search"
                type="submit"
                className={`outline-none text-xl text-gray-400 absolute top-0 right-0 end-0 w-12 h-full flex items-center justify-center transition duration-200 ease-in-out hover:text-heading focus:outline-none text-store-500 z-10`}>
                <IoSearchOutline />
              </button>
              <SearchSuggestions
                searchText={searchText}
                showSuggestions={showSuggestions}
                onSelect={() => {
                  setSearchText("");
                  setShowSuggestions(false);
                  setShowSearch(false);
                }}
                onClose={() => setShowSuggestions(false)}
              />
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default dynamic(() => Promise.resolve(MobileFooter), { ssr: false });

