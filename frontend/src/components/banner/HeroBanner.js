import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import { IoSearchOutline } from "react-icons/io5";
import { HiShieldCheck } from "react-icons/hi";
import { RiTruckLine } from "react-icons/ri";
import { MdVerified } from "react-icons/md";
import useTranslation from "next-translate/useTranslation";
import LocationPickerDropdown from "@components/location/LocationPickerDropdown";
import SearchSuggestions from "@components/search/SearchSuggestions";
import useGetSetting from "@hooks/useGetSetting";

const HeroBanner = () => {
  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const { t } = useTranslation("common");
  const searchInputRef = useRef(null);
  const { storeCustomizationSetting } = useGetSetting();

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
      router
        .push(
          { pathname: "/search", query: { query: trimmedSearchText } },
          `/search?query=${encodeURIComponent(trimmedSearchText)}`,
          { shallow: false }
        )
        .then(() => setSearchText(""))
        .catch((err) => {
          window.location.href = `/search?query=${encodeURIComponent(trimmedSearchText)}`;
        });
    }
  };

  const bannerImageUrl = "/images/martbanner.png";

  const badges = [
    { icon: <MdVerified className="w-4 h-4 text-blue-400" />, label: "100% Verified Quality" },
    { icon: <RiTruckLine className="w-4 h-4 text-blue-400" />, label: "Express Fast Delivery" },
    { icon: <HiShieldCheck className="w-4 h-4 text-blue-400" />, label: "Secure Payment Checkout" },
  ];

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        minHeight: "520px",
        backgroundImage: `url(${bannerImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center right",
        backgroundRepeat: "no-repeat",
        bottom: "50px"
      }}
    >
      {/* SaaS-style crisp radial dark gradient overlay for centered text clarity */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: "radial-gradient(circle, rgba(9, 9, 11, 0.85) 0%, rgba(9, 9, 11, 0.75) 50%, rgba(9, 9, 11, 0.3) 85%, rgba(9, 9, 11, 0.1) 100%)",
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-20 flex items-center justify-center min-h-[520px] px-6 sm:px-12 md:px-16 lg:px-24 py-16 text-center">
        <div className="w-full max-w-[720px] flex flex-col items-center justify-center">

          {/* Minimal SaaS Cosmic Badging */}
          <div className="inline-flex items-center gap-1.5 mb-6 px-4 py-1.5 rounded-full cosmic-badge tracking-wide font-sans">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            <span>Premium B2C E-commerce Marketplace ✨</span>
          </div>

          {/* SaaS Typography: Ultra bold, tight line height */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black cosmic-title leading-[1.12] tracking-tight mb-5 font-sans"
          >
            {storeCustomizationSetting?.home?.hero_title ? (
              storeCustomizationSetting.home.hero_title
            ) : (
              <>
                Elevate Your Sourcing.
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300">
                  Kalki Mart Solutions.
                </span>
              </>
            )}
          </h1>

          {/* Description — SaaS standard neutral grey */}
          <p className="cosmic-desc text-sm leading-relaxed max-w-[540px] mx-auto mb-10 font-normal font-sans">
            {storeCustomizationSetting?.home?.hero_description ||
              "Your ultimate B2C wholesale marketplace. Discover premium business supplies, customized corporate merchandise, and advertising essentials at direct-from-distributor pricing."}
          </p>

          {/* Clean SaaS Input Panel — rounded-xl layout with high focus outline definition */}
          <div id="hero-search-anchor" className="w-full max-w-[660px] mx-auto scroll-mt-32">
            <form
              onSubmit={handleSubmit}
              className="flex items-center cosmic-search-container p-1.5 rounded-xl transition-all duration-300 gap-1"
            >
              {/* Location Selector */}
              <div className="shrink-0 flex items-center pl-1.5">
                <LocationPickerDropdown
                  hideDivider
                  className="!px-2 !border-none !bg-transparent !text-slate-600 !text-[13px] !font-semibold"
                />
              </div>

              {/* Vertical line divider */}
              <div className="w-px h-5 cosmic-divider shrink-0 mx-1" />

              {/* Search text input */}
              <div className="flex-1 flex items-center px-2 relative min-w-0">
                <IoSearchOutline className="text-slate-400 text-lg shrink-0 mr-2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="What products or custom items are you looking for?"
                  className="w-full py-2 cosmic-search-input text-[13px] font-medium focus:outline-none focus:ring-0 min-w-0"
                  value={searchText}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (searchText.trim().length > 0) setShowSuggestions(true);
                  }}
                  onBlur={(e) => {
                    const relatedTarget = e.relatedTarget;
                    const sc = document.querySelector(".search-suggestions-container");
                    if (!relatedTarget || (sc && !sc.contains(relatedTarget))) {
                      setTimeout(() => {
                        const ae = document.activeElement;
                        if (!sc || !sc.contains(ae)) setShowSuggestions(false);
                      }, 200);
                    }
                  }}
                />
                <SearchSuggestions
                  searchText={searchText}
                  showSuggestions={showSuggestions}
                  onSelect={() => { setSearchText(""); setShowSuggestions(false); }}
                  onClose={() => setShowSuggestions(false)}
                />
              </div>

              {/* SaaS Accent Action Button */}
              <button
                type="submit"
                className="shrink-0 flex items-center gap-1.5 active:scale-[0.98] cosmic-search-btn text-white text-[13px] font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 shadow-sm"
              >
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Minimalist SaaS cosmic outline badges (styled like outline buttons) */}
          <div className="grid grid-cols-2 md:flex items-center justify-center gap-3 md:gap-4 mt-12 w-full max-w-xl md:max-w-none mx-auto px-1 sm:px-0">
            {badges.map((b, i) => (
              <div
                key={i}
                className={`flex items-center justify-center gap-2 cosmic-badge-pill px-4 py-2 text-[11px] sm:text-xs font-semibold hover:scale-[1.03] transition-all duration-200 cursor-pointer ${
                  i === 2 ? "col-span-2 mx-auto md:mx-0 w-auto" : "w-full md:w-auto"
                }`}
              >
                {b.icon}
                <span className="tracking-wide font-sans whitespace-nowrap">{b.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
