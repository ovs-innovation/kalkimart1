import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useContext } from "react";
import { IoAdd, IoRemove, IoStar, IoCartOutline } from "react-icons/io5";
import { FiHeart, FiShuffle } from "react-icons/fi";
import { useCart } from "react-use-cart";
import { useRouter } from "next/router";

// Internal imports
import Stock from "@components/common/Stock";
import { notifyError, notifySuccess } from "@utils/toast";
import useAddToCart from "@hooks/useAddToCart";
import { UserContext } from "@context/UserContext";
import useGetSetting from "@hooks/useGetSetting";
import Discount from "@components/common/Discount";
import useUtilsFunction from "@hooks/useUtilsFunction";
import ProductModal from "@components/modal/ProductModal";
import ImageWithFallback from "@components/common/ImageWithFallBack";
import { handleLogEvent } from "src/lib/analytics";
import { addToWishlist } from "@lib/wishlist";

const productImages = {
  "paracetamol-500mg": "/images/img1.jpeg",
  "Combiflame": "/images/img2.jpeg",
  "Cardicheck": "/images/img3.jpeg",
  "tafamidis": "/images/img4.webp",
  "vitamin c-100mg": "/images/img5.jpeg",
};

const PersonalCareProductCard = ({
  product,
  attributes,
  hidePriceAndAdd = false,
  hideDiscount = false,
  hideWishlistCompare = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const { items, addItem, updateItemQuantity, inCart, getItem } = useCart();
  const { state } = useContext(UserContext) || {};
  const isWholesaler =
    state?.userInfo?.role &&
    state.userInfo.role.toString().toLowerCase() === "wholesaler";
  const { handleIncreaseQuantity } = useAddToCart();
  const { globalSetting } = useGetSetting();
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue, getNumberTwo } = useUtilsFunction();
  const router = useRouter();

  const currency = "₹";

  const handleAddItem = (p) => {
    if (p.stock < 1) return notifyError("Insufficient stock!");

    if (p?.variants?.length > 0) {
      setModalOpen(!modalOpen);
      return;
    }
    const { slug, variants, categories, description, ...updatedProduct } = product;

    const wholesalePriceValue =
      product?.wholePrice && Number(product.wholePrice) > 0
        ? Number(product.wholePrice)
        : null;
    const priceToUse =
      isWholesaler && wholesalePriceValue ? wholesalePriceValue : (p.prices?.price || 0);

    const newItem = {
      ...updatedProduct,
      title: showingTranslateValue(p?.title),
      id: p._id,
      variant: p.prices,
      price: priceToUse,
      originalPrice: product.prices?.originalPrice,
      image: product.image?.[0] || product.images?.[0],
    };

    const minQty =
      isWholesaler && product?.minQuantity ? Number(product.minQuantity) : 1;
    addItem(newItem, minQty);
  };

  const handleAddToWishlist = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;

    try {
      const result = addToWishlist(product);
      if (!result.ok && result.reason === "exists") {
        notifyError("Product already in wishlist");
        return;
      }
      if (!result.ok) {
        notifyError("Failed to add to wishlist");
        return;
      }
      notifySuccess("Product added to wishlist");
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      notifyError("Failed to add to wishlist");
    }
  };

  const handleAddToCompare = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;

    try {
      const storedCompare = localStorage.getItem("compare");
      let compare = storedCompare ? JSON.parse(storedCompare) : [];
      const exists = compare.some((item) => item._id === product._id);

      if (exists) {
        notifyError("Product already in compare list");
        return;
      }
      if (compare.length >= 4) {
        notifyError("You can compare maximum 4 products");
        return;
      }

      compare.push(product);
      localStorage.setItem("compare", JSON.stringify(compare));
      notifySuccess("Product added to compare list");
    } catch (error) {
      console.error("Error adding to compare:", error);
      notifyError("Failed to add to compare list");
    }
  };

  const imageSrc =
    product?.image?.[0] || "/placeholder.png";

  return (
    <>
      {modalOpen && (
        <ProductModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          product={product}
          currency={currency}
          attributes={attributes}
        />
      )}
      
      {/* Premium organic card design */}
      <div className="group relative flex flex-col w-full h-full max-w-[360px] xl:max-w-[370px] mx-auto select-none bg-neutral-900/30 border border-neutral-800/60 rounded-3xl p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-store-500/40 hover:bg-neutral-900/50 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        
        {/* Product Image Container Box */}
        <div
          onClick={() => {
            router.push(`/product/${product.slug}`);
            handleLogEvent("product", `Mapped to ${showingTranslateValue(product?.title)} product page`);
          }}
          className="relative w-full h-[180px] sm:h-[200px] rounded-2xl overflow-hidden transition-all duration-300 group/img flex-shrink-0 cursor-pointer bg-transparent"
        >
          {/* Natural Discount Badge */}
          {!hideDiscount && !isWholesaler && (() => {
            const basePrice = product?.isCombination ? product?.variants[0]?.price : product?.prices?.price;
            const discountVal = product?.isCombination ? product?.variants[0]?.discount : product?.prices?.discount;
            let originalPrice = product?.isCombination ? product?.variants[0]?.originalPrice : product?.prices?.originalPrice;
            if (!originalPrice && discountVal) {
              originalPrice = (basePrice || 0) + (discountVal || 0);
            }
            const discountPercentage = originalPrice > basePrice ? Math.round(((originalPrice - basePrice) / originalPrice) * 100) : 0;
            const finalDiscount = product?.discount || discountPercentage;

            return finalDiscount > 1 ? (
              <span className="absolute top-2 left-2 z-10 bg-[#D4A359] text-neutral-950 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap uppercase tracking-wider">
                {finalDiscount}% OFF
              </span>
            ) : null;
          })()}

          {/* Stock Status Badge */}
          {product.stock < 1 && (
            <div className="absolute top-2 left-2 z-10">
              <Stock product={product} stock={product.stock} card />
            </div>
          )}

          {/* Wishlist */}
          {!hideWishlistCompare && (
            <div className="absolute top-2 right-2 z-30 flex flex-col gap-1.5 opacity-0 translate-x-2 group-hover/img:opacity-100 group-hover/img:translate-x-0 transition-all duration-300">
              <button
                onClick={handleAddToWishlist}
                className="p-1.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-red-500 rounded-full shadow-sm hover:shadow border border-neutral-700/60 hover:scale-110 active:scale-95 transition-all duration-300 backdrop-blur-md"
                aria-label="Add to wishlist"
              >
                <FiHeart className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Product Image */}
          <div className="relative w-full h-full p-2 sm:p-2.5 flex items-center justify-center">
            <div className="relative w-full h-full">
              {product.image?.[0] ? (
                <ImageWithFallback
                  src={imageSrc}
                  alt={showingTranslateValue(product?.title)}
                  style={{ objectFit: "contain" }}
                  className="w-full h-full object-contain drop-shadow-sm rounded-xl"
                />
              ) : (
                <Image
                  src="/placeholder.png"
                  alt="product"
                  fill
                  style={{ objectFit: "contain" }}
                  sizes="100%"
                  className="w-full h-full object-contain drop-shadow-sm rounded-xl"
                />
              )}
            </div>
          </div>
        </div>

        {/* Info Content Section */}
        <div className="flex flex-col pt-3 pb-2 text-left bg-transparent flex-grow">
          
          {/* Brand Tag */}
          {(() => {
            const brand =
              (product?.brand?.name ? showingTranslateValue(product.brand.name) : null) ||
              product?.brandName;
            const isPharmacyOrPersonalCare = /pharmacy|personal care|wellness/i.test(brand || "");
            return brand && !isPharmacyOrPersonalCare ? (
              <div className="text-[10px] font-bold tracking-wider text-[#D4A359] mb-1 uppercase truncate">
                {brand}
              </div>
            ) : null;
          })()}

          {/* Product Title Wrapper with Fixed Height for Vertical Alignment */}
          <div className="h-11 flex items-center mb-1.5">
            <h2
              className="text-sm md:text-base font-bold text-neutral-100 line-clamp-2 leading-snug hover:text-[#FED7AA] transition-colors cursor-pointer w-full"
              onClick={() => router.push(`/product/${product.slug}`)}
              title={showingTranslateValue(product?.title)}
            >
              {showingTranslateValue(product?.title)}
            </h2>
          </div>


          {/* Price Section with Fixed Height for Vertical Alignment */}
          {!hidePriceAndAdd && (
            <div className="h-8 flex items-center mt-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                {(() => {
                  const basePrice = product?.isCombination ? product?.variants[0]?.price : product?.prices?.price;
                  const wholesalePrice = product?.wholePrice && Number(product.wholePrice) > 0 ? Number(product.wholePrice) : null;
                  const currentPrice = isWholesaler && wholesalePrice ? wholesalePrice : basePrice;
                  const discount = product?.isCombination ? product?.variants[0]?.discount : product?.prices?.discount;
                  let originalPriceValue = product?.isCombination ? product?.variants[0]?.originalPrice : product?.prices?.originalPrice;

                  if (!originalPriceValue && discount) {
                    originalPriceValue = (basePrice || 0) + (discount || 0);
                  }
                  const hasDiscount = !isWholesaler && originalPriceValue > currentPrice;

                  return (
                    <>
                      <p className={`text-base md:text-lg font-extrabold ${hasDiscount ? 'text-rose-500' : 'text-neutral-100'}`}>
                        {currency}{getNumberTwo(Math.max(0, currentPrice))}
                      </p>
                      {hasDiscount && (
                        <p className="text-xs text-neutral-400 line-through font-medium mt-0.5">
                          {currency}{getNumberTwo(originalPriceValue)}
                        </p>
                      )}
                      {isWholesaler && wholesalePrice && (
                        <p className="text-xs text-neutral-400 w-full mt-0.5">
                          Wholesale: <span className="font-semibold">{currency}{getNumberTwo(wholesalePrice)}</span>
                          {product.minQuantity ? ` (Min ${product.minQuantity})` : ""}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Action Button Section */}
          {!hidePriceAndAdd && (
            <div className="flex justify-start w-full mt-auto">
              {inCart(product._id) ? (
                (() => {
                  const item = getItem(product._id);
                  return (
                    item && (
                      <div key={item.id} className="h-8 w-28 flex items-center justify-between px-2.5 border border-[#D4A359]/30 text-neutral-200 bg-[#161412] rounded-full font-bold transition-all shadow-sm mt-2">
                        <button
                          onClick={() => {
                            const minQty = isWholesaler && product?.minQuantity ? Number(product.minQuantity) : 1;
                            if (isWholesaler && product?.minQuantity && item.quantity <= minQty) {
                              notifyError(`Minimum quantity is ${minQty}`);
                              return;
                            }
                            updateItemQuantity(item.id, item.quantity - 1);
                          }}
                          disabled={isWholesaler && product?.minQuantity && item.quantity <= Number(product.minQuantity)}
                          className={`p-1 hover:text-[#FED7AA] transition-colors ${isWholesaler && product?.minQuantity && item.quantity <= Number(product.minQuantity) ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <IoRemove className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-xs font-bold text-white px-1">
                          {item.quantity}
                        </p>
                        <button
                          className="p-1 hover:text-[#FED7AA] transition-colors"
                          onClick={() =>
                            item?.variants?.length > 0
                              ? handleAddItem(item)
                              : handleIncreaseQuantity({ ...item, stock: product.stock })
                          }
                        >
                          <IoAdd className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  );
                })()
              ) : (
                <button
                  onClick={() => handleAddItem(product)}
                  title="Add to cart"
                  className="flex items-center gap-2 mt-2 group/btn cursor-pointer select-none"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FED7AA] flex items-center justify-center text-[#111827] shadow-[0_2px_12px_rgba(212,163,89,0.3)] group-hover/btn:bg-[#f6c888] group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all duration-300">
                    <IoCartOutline className="w-4 h-4 text-[#111827]" />
                  </div>
                  <span className="text-[10px] md:text-xs font-black text-neutral-300 tracking-wider uppercase group-hover/btn:text-[#FED7AA] transition-colors duration-300">
                    ADD TO CART
                  </span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default dynamic(() => Promise.resolve(PersonalCareProductCard), {
  ssr: false,
});
