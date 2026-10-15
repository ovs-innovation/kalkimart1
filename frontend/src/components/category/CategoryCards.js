import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useQuery } from "@tanstack/react-query";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";

// Internal imports
import CategoryServices from "@services/CategoryServices";
import useUtilsFunction from "@hooks/useUtilsFunction";
import ImageWithFallback from "@components/common/ImageWithFallBack";

const BG_COLORS = [
  "bg-[#eefaf3]", // Soft Mint Green
  "bg-[#f5effa]", // Soft Lavender
  "bg-[#faf0ee]", // Soft Peach/Coral
  "bg-[#edf6fa]", // Soft Ice Blue
  "bg-[#faf5eb]", // Soft Warm Cream
  "bg-[#faf0f4]", // Soft Blush Pink
  "bg-[#f0f9ff]", // Soft Sky Blue
  "bg-[#fefce8]", // Soft Pale Gold
];

const FALLBACK_IMAGES = [
  "/flags/cat7.webp",
  "/flags/cat3.webp",
  "/flags/cat4.webp",
  "/flags/drinks.webp",
  "/flags/cat8.webp",
  "/flags/cat9.webp",
];

const CategoryCards = () => {
  const router = useRouter();
  const { showingTranslateValue } = useUtilsFunction();

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["category"],
    queryFn: async () => await CategoryServices.getShowingCategory(),
  });

  const categories = useMemo(() => {
    if (!categoriesData || !Array.isArray(categoriesData) || categoriesData.length === 0) {
      return [];
    }

    const homeRoot = categoriesData.find(
      (cat) =>
        cat.id === "Root" ||
        showingTranslateValue(cat?.name)?.toLowerCase() === "home"
    );

    const topLevel = homeRoot?.children?.length ? homeRoot.children : categoriesData;
    return topLevel || [];
  }, [categoriesData, showingTranslateValue]);

  const handleCategoryClick = (category) => {
    const catName = showingTranslateValue(category?.name) || "";
    const catSlug =
      category?.slug ||
      catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    router.push(`/search?category=${encodeURIComponent(catSlug)}&_id=${category._id}`);
  };

  // If loading and no cached data, show clean circular skeleton placeholders
  if (isLoading && categories.length === 0) {
    return (
      <div className="w-full bg-transparent py-12 md:py-16 relative overflow-hidden">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center justify-center mb-10 text-center animate-pulse">
            <div className="h-4 w-28 bg-neutral-800 rounded mb-2"></div>
            <div className="h-8 w-60 bg-neutral-800 rounded"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full bg-neutral-800/60 mb-4"></div>
                <div className="h-4 w-20 bg-neutral-800 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If no categories found, gracefully hide section
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-transparent py-12 md:py-16 relative overflow-hidden">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Centered Header Block */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <span className="text-xs md:text-sm font-bold text-[#F3C47A] tracking-widest uppercase mb-1">
            Our Categories
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Shop by Category
          </h2>
          <div className="w-12 h-[3px] bg-[#D4A359] rounded-full mt-3"></div>
        </div>

        {/* Carousel Window */}
        <div className="relative group/swiper">
          <Swiper
            modules={[Autoplay, Navigation]}
            spaceBetween={16}
            slidesPerView={2.2}
            loop={categories.length >= 6}
            breakpoints={{
              480: { slidesPerView: 3, spaceBetween: 16 },
              640: { slidesPerView: 4, spaceBetween: 20 },
              1024: { slidesPerView: 5, spaceBetween: 20 },
              1280: { slidesPerView: 6, spaceBetween: 24 },
            }}
            autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            navigation={{ prevEl: ".cat-prev", nextEl: ".cat-next" }}
            className="category-cards-swiper"
          >
            {categories.map((category, index) => {
              const title = showingTranslateValue(category?.name) || category?.name?.en || "Category";
              const bgColor = BG_COLORS[index % BG_COLORS.length];
              const imageSrc = category?.icon || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

              return (
                <SwiperSlide key={category._id || index}>
                  <div
                    className="flex flex-col items-center cursor-pointer select-none group"
                    onClick={() => handleCategoryClick(category)}
                  >
                    {/* Outer Circle Container */}
                    <div className="flex items-center justify-center w-full mb-1">
                      {/* The Circle Card Itself */}
                      <div
                        className={`w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 ${bgColor} rounded-full flex items-center justify-center p-5 transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]`}
                      >
                        {/* Image directly centered inside */}
                        <div className="relative w-[65%] h-[65%] transform transition-transform duration-300 ease-out group-hover:scale-110">
                          <ImageWithFallback
                            src={imageSrc}
                            alt={title}
                            fill
                            className="object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.06)]"
                            sizes="(max-width: 768px) 30vw, 15vw"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clean Category Label Title directly below box container */}
                    <h3 className="mt-4 text-sm md:text-base font-bold text-neutral-200 text-center tracking-tight px-1 line-clamp-1 group-hover:text-[#FED7AA] transition-colors duration-300">
                      {title}
                    </h3>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Minimal Hover Arrow Controllers */}
          <button
            type="button"
            aria-label="Previous Category"
            className="cat-prev absolute left-[-16px] top-[40%] -translate-y-1/2 w-10 h-10 z-30 flex items-center justify-center rounded-full bg-[#131417]/90 border border-neutral-700 text-neutral-300 hover:text-[#FED7AA] hover:border-[#D4A359]/60 opacity-0 group-hover/swiper:opacity-100 transition-all shadow-lg hover:bg-neutral-800"
          >
            <IoChevronBack size={18} />
          </button>
          <button
            type="button"
            aria-label="Next Category"
            className="cat-next absolute right-[-16px] top-[40%] -translate-y-1/2 w-10 h-10 z-30 flex items-center justify-center rounded-full bg-[#131417]/90 border border-neutral-700 text-neutral-300 hover:text-[#FED7AA] hover:border-[#D4A359]/60 opacity-0 group-hover/swiper:opacity-100 transition-all shadow-lg hover:bg-neutral-800"
          >
            <IoChevronForward size={18} />
          </button>
        </div>

        {/* Centered View All Button */}
        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={() => router.push("/categories")}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-neutral-700 bg-[#161412] text-sm font-semibold text-neutral-200 hover:border-[#D4A359]/60 hover:text-[#FED7AA] hover:bg-neutral-800 transition-all shadow-sm"
          >
            View All Categories
            <span className="text-base font-normal">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCards;