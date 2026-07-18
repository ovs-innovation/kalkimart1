import Head from "next/head";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import { useRef, useEffect, useState } from "react";

//internal import

import Navbar from "@layout/navbar/Navbar";
import Footer from "@layout/footer/Footer";
import NavBarTop from "./navbar/NavBarTop";
import FooterTop from "@layout/footer/FooterTop";
import MobileFooter from "@layout/footer/MobileFooter";
import MobileBottomNavigation from "@layout/footer/MobileBottomNavigation";
import FeatureCard from "@components/feature-card/FeatureCard";
import useGetSetting from "@hooks/useGetSetting";
import { getPalette, DEFAULT_STORE_COLOR } from "@utils/themeColors";
import useCartSync from "@hooks/useCartSync";
import FloatingWhatsApp from "@components/common/FloatingWhatsApp";
import { pickBrandLogo } from "@utils/brandAssets";

const Layout = ({ title, description, children, hideMobileHeader }) => {
  const router = useRouter();
  const isHome = router.pathname === "/";
  const { storeCustomizationSetting, globalSetting } = useGetSetting();
  const storeColor = "blue";
  const palette = getPalette(storeColor);

  // Dynamically measure header height so content starts exactly below the fixed header
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    
    const el = headerRef.current;
    if (!el) return;
    setHeaderHeight(el.offsetHeight);
    const observer = new ResizeObserver(() => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    });
    observer.observe(el);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  // Sync prescription medicines to cart
  useCartSync();

  // Get dynamic title and favicon from settings
  const siteTitle = "Kalki Mart";
  const favicon = pickBrandLogo(
    storeCustomizationSetting?.seo?.favicon,
    globalSetting?.logo,
    storeCustomizationSetting?.navbar?.logo
  );
  const defaultDescription =
    storeCustomizationSetting?.seo?.meta_description ||
    description ||
    "Discover personalized merchandise, branded giveaways, and advertising essentials. Ideal for businesses, events, and promotions";

  const hexToRgb = (hex) => {
    if (!hex) return "20, 184, 166";
    const cleaned = hex.replace("#", "");
    if (cleaned.length === 3) {
      const expanded = cleaned.split("").map(c => c + c).join("");
      const num = parseInt(expanded, 16);
      return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
    }
    if (cleaned.length === 6) {
      const num = parseInt(cleaned, 16);
      return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
    }
    return "20, 184, 166";
  };

  return (
    <>
      <div className="font-sans min-h-screen">
        <Head>
          <style>
            {`
              :root {
                --store-color-50: ${palette[50]};
                --store-color-100: ${palette[100]};
                --store-color-200: ${palette[200]};
                --store-color-300: ${palette[300]};
                --store-color-400: ${palette[400]};
                --store-color-500: ${palette[500]};
                --store-color-600: ${palette[600]};
                --store-color-700: ${palette[700]};
                --store-color-800: ${palette[800]};
                --store-color-900: ${palette[900]};
                --store-color-rgb: ${palette[500]?.startsWith("#") ? hexToRgb(palette[500]) : "20, 184, 166"};
              }
            `}
          </style>
          <title>
            {title ? `${siteTitle} | ${title}` : siteTitle}
          </title>
          <meta name="description" content={description || defaultDescription} />
          <link rel="icon" href="/favicon.png?v=3" />
          <link rel="shortcut icon" href="/favicon.png?v=3" />
          <link rel="apple-touch-icon" href="/favicon.png?v=3" />
        </Head>

        {/* Mobile header (fixed top, hidden on desktop) */}
        {!hideMobileHeader && <MobileFooter />}
        {!hideMobileHeader && <MobileBottomNavigation />}

        {/* Desktop header — inline styles force position:fixed at viewport top, bypassing any CSS specificity issues */}
        <div
          ref={headerRef}
          className="hidden lg:block transition-all duration-300"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: isScrolled ? "rgba(26, 26, 26, 0.8)" : (isHome ? "transparent" : "#1A1A1A"),
            backdropFilter: isScrolled ? "blur(16px)" : "none",
            borderBottom: isScrolled ? "1px solid #2A2A2A" : (isHome ? "none" : "1px solid #2A2A2A"),
          }}
        >
          <NavBarTop />
          <Navbar />
        </div>

        {/* Page content — paddingTop dynamically equals the actual fixed header height on desktop only */}
        <div
          className={`${hideMobileHeader ? "pt-0" : "pt-16"} pb-16 lg:pb-0`}
          style={
            headerHeight > 0 && typeof window !== "undefined" && window.innerWidth >= 1024
              ? { paddingTop: `${headerHeight}px` }
              : {}
          }
        >
          {children}
        </div>

        <div className="w-full">
          <div className="w-full">
            <Footer />
          </div>
        </div>

        <FloatingWhatsApp />
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default Layout;