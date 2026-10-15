import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import { IoSearchOutline } from "react-icons/io5";
import { HiShieldCheck, HiLockClosed } from "react-icons/hi";
import { RiTruckLine } from "react-icons/ri";
import useTranslation from "next-translate/useTranslation";
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
        .catch(() => {
          window.location.href = `/search?query=${encodeURIComponent(trimmedSearchText)}`;
        });
    }
  };

  const badges = [
    {
      icon: <HiShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#F3C47A]" />,
      label: "100% Verified Quality",
    },
    {
      icon: <RiTruckLine className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#F3C47A]" />,
      label: "Express Fast Delivery",
    },
    {
      icon: <HiLockClosed className="w-4 h-4 text-[#F3C47A]" />,
      label: "Secure Payment Checkout",
    },
  ];

  return (
    <div
      className="w-full relative overflow-hidden bg-[#070709]"
      style={{
        backgroundImage: "url('/images/kalki-hero-banner-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center right",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark gradient overlay on the left to ensure high readability of hero text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(7, 7, 9, 0.96) 0%, rgba(7, 7, 9, 0.90) 36%, rgba(7, 7, 9, 0.45) 65%, rgba(7, 7, 9, 0.05) 90%, transparent 100%)",
        }}
      />

      {/* Additional subtle dark scrim for smaller mobile screens */}
      <div className="absolute inset-0 pointer-events-none bg-black/45 lg:hidden" />

      {/* Hero Content Container — generous left/right padding and proper max-width */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 pt-14 sm:pt-16 lg:pt-[82px] pb-12 sm:pb-14 lg:pb-16 min-h-[520px] lg:min-h-[560px] flex flex-col justify-start">
        <div className="w-full max-w-xl md:max-w-2xl lg:max-w-[700px] xl:max-w-[740px] flex flex-col items-start text-left">

          {/* Top Gold Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4A359]/40 bg-[#161412]/80 backdrop-blur-sm text-xs sm:text-sm font-medium text-neutral-200 mb-5 sm:mb-6 transition-all hover:border-[#D4A359]/60 shadow-[0_0_20px_rgba(212,163,89,0.15)]">
            <svg className="w-3.5 h-3.5 text-[#F3C47A] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5L12 1Z" />
            </svg>
            <span className="tracking-wide">
              {storeCustomizationSetting?.home?.hero_badge || "Premium B2C E-Commerce Marketplace"}
            </span>
          </div>

          {/* Big Bold Headline — clean 2-line layout without awkward line breaks */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[52px] font-extrabold tracking-tight leading-[1.14] mb-4 sm:mb-5 font-sans">
            <span className="block text-white">
              {storeCustomizationSetting?.home?.hero_title_1 || "Elevate Your Sourcing."}
            </span>
            <span className="block text-[#F9D39D] mt-1.5 sm:mt-2">
              {storeCustomizationSetting?.home?.hero_title_2 || "Kalki Mart Solutions."}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-neutral-300 text-sm sm:text-base lg:text-lg font-normal max-w-xl mb-7 sm:mb-8 leading-relaxed">
            {storeCustomizationSetting?.home?.hero_description ||
              "Premium wholesale essentials for smart, reliable business buying."}
          </p>

          {/* Sleek Dark Search Container — Wide, Spacious & Clean */}
          <div id="hero-search-anchor" className="w-full max-w-xl md:max-w-2xl lg:max-w-[700px] xl:max-w-[740px] scroll-mt-32 mb-8 sm:mb-9">
            <form
              onSubmit={handleSubmit}
              className="flex items-center bg-[#131417]/95 backdrop-blur-md border border-neutral-700/80 hover:border-neutral-600 focus-within:border-[#FED7AA]/70 rounded-2xl p-1.5 sm:p-2 transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.7)]"
            >
              {/* Search text input */}
              <div className="flex-1 flex items-center px-3 sm:px-4 relative min-w-0">
                <IoSearchOutline className="text-neutral-400 text-xl shrink-0 mr-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for what you need"
                  className="w-full py-2.5 sm:py-3 bg-transparent text-white placeholder-neutral-400 text-sm sm:text-base font-normal focus:outline-none min-w-0"
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
                  onSelect={() => {
                    setSearchText("");
                    setShowSuggestions(false);
                  }}
                  onClose={() => setShowSuggestions(false)}
                />
              </div>

              {/* Warm Gold Pill Search Button */}
              <button
                type="submit"
                className="shrink-0 flex items-center gap-2 bg-[#FED7AA] hover:bg-[#f6c888] active:scale-[0.98] text-[#111827] text-sm sm:text-base font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all duration-200 shadow-md cursor-pointer"
              >
                <IoSearchOutline className="text-lg text-[#111827]" />
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Trust Badges Row — Single clean horizontal row that never wraps awkwardly */}
          <div className="flex flex-row items-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-neutral-300 w-full overflow-x-auto no-scrollbar py-1">
            {badges.map((badge, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <div className="w-px h-5 bg-neutral-700/60 shrink-0 hidden sm:block" />
                )}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-[#D4A359]/70 bg-[#161412]/60 flex items-center justify-center shrink-0">
                    {badge.icon}
                  </div>
                  <span className="text-neutral-200 text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap">
                    {badge.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
