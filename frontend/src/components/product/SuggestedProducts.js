import React, { useEffect, useState, useContext } from "react";
import Cookies from "js-cookie";
import { SidebarContext } from "@context/SidebarContext";
import { UserContext } from "@context/UserContext";
import ProductServices from "@services/ProductServices";
import ProductCard from "@components/product/ProductCard";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { FiChevronRight } from "react-icons/fi";
import SectionHeader from "@components/common/SectionHeader";

const SuggestedProducts = () => {
  const { showingTranslateValue } = useUtilsFunction();
  const { isLoading, setIsLoading } = useContext(SidebarContext);
  const { state } = useContext(UserContext) || {};
  const isWholesaler = state?.userInfo?.role && state.userInfo.role.toString().toLowerCase() === "wholesaler";
  const [products, setProducts] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Responsive product count
  const getVisibleCount = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) return 6; // lg and up
      return 4; // sm and below
    }
    return 6;
  };
  const [visibleCount, setVisibleCount] = useState(getVisibleCount());

  useEffect(() => {
    // Update visibleCount on resize
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchSuggestedProducts = async () => {
      try {
        setFetchLoading(true);
        let userInfo = null;
        try {
          const cookie = Cookies.get("userInfo");
          if (cookie) userInfo = JSON.parse(cookie);
        } catch (e) { }

        let params = {};
        let guestIds = [];
        const guestHistory = localStorage.getItem("recentlyViewed");
        console.log("SuggestedProducts: Loaded guestHistory from LS:", guestHistory);
        if (guestHistory) {
          try {
            const parsed = JSON.parse(guestHistory);
            if (Array.isArray(parsed)) {
              const unique = Array.from(new Set(parsed.map(item => item._id)));
              guestIds = unique;
              params.productIds = guestIds.join(",");
            }
          } catch (e) {
            console.error("Error parsing guest history", e);
          }
        }
        console.log("SuggestedProducts: Fetching suggestions with params:", params);
        const res = await ProductServices.getSuggestedProducts(params);
        console.log("SuggestedProducts: Received response from API:", res);
        
        const filtered = Array.isArray(res)
          ? res.filter((p, i, arr) => p && arr.findIndex(x => x._id === p._id) === i)
          : [];
        
        // If wholesaler, filter to wholesale-eligible products only
        if (isWholesaler) {
          setProducts(filtered.filter(p => (p.wholePrice && Number(p.wholePrice) > 0) || p.isWholesaler));
        } else {
          setProducts(filtered);
        }
      } catch (err) {
        console.error("SuggestedProducts: Error fetching suggested products:", err);
        setProducts([]);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchSuggestedProducts();
  }, []);

  if (fetchLoading) {
    return null; // Or a skeleton loader
  }

  if (products.length === 0) {
    // Edge case: new user, cleared cache, or all products deleted
    return null;
  }

  return (
    <div className="relative lg:py-12 py-8 bg-transparent">
      <div className="relative z-10 px-2 sm:px-4">
        {/* Header Section with Badge */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4A359]/40 bg-[#161412]/80 text-[#F9D39D] text-[10px] font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(212,163,89,0.1)]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#F3C47A] animate-ping" />
            Picked For You
          </div>
          <SectionHeader
            title="Suggested For You"
            subtitle="Personalized recommendations based on your activity"
            align="left"
          />
        </div>

        {/* Responsive Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
          {(isWholesaler
            ? (showAll ? products : products.slice(0, visibleCount)).filter(p => (p.wholePrice && Number(p.wholePrice) > 0) || p.isWholesaler)
            : (showAll ? products : products.slice(0, visibleCount))
          ).map((product) => (
            <div key={product._id} className="transition-all duration-500 hover:-translate-y-2">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Enhanced "View All" Button */}
        {products.length > visibleCount && !showAll && (
          <div className="flex justify-center mt-12">
            <button
              className="group relative px-8 py-3 rounded-full bg-[#FED7AA] text-[#111827] font-bold flex items-center gap-3 transition-all duration-300 hover:bg-[#f6c888] hover:shadow-[0_8px_25px_rgba(212,163,89,0.25)] active:scale-95"
              onClick={() => setShowAll(true)}
            >
              <span className="relative z-10 text-sm">View All Suggestions</span>
              <div className="bg-[#111827] text-white rounded-full p-1 group-hover:translate-x-1 transition-transform">
                <FiChevronRight className="text-sm" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedProducts;
