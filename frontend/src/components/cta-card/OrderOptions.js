import React, { useState } from "react";
import { FaPhoneVolume, FaFilePrescription, FaWhatsapp } from "react-icons/fa";
import PrescriptionUploadModal from "@components/prescription/PrescriptionUploadModal";
import useGetSetting from "@hooks/useGetSetting";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { DEFAULT_STORE_COLOR, getPalette } from "@utils/themeColors";

const OrderOptions = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null); // "call", "whatsapp", "prescription"
  const { storeCustomizationSetting, globalSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  const storeColor = storeCustomizationSetting?.theme?.color || DEFAULT_STORE_COLOR;
  const palette = getPalette(storeColor);

  const contactNumber = 
    storeCustomizationSetting?.navbar?.phone || 
    showingTranslateValue(storeCustomizationSetting?.contact_us?.call_box_phone) ||
    globalSetting?.contact ||
    "09240250346";

  const cardBase =
    "flex items-center p-4 md:p-5 rounded-2xl transition-all duration-300 cursor-pointer group border overflow-hidden relative premium-shadow hover-scale backdrop-blur-md";

  return (
    <>
      <div className="w-full max-w-5xl mx-auto mt-4 md:mt-6 px-4">
        <div className="flex items-center justify-center mb-6">
          <div className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent to-store-500/30" />
          <span className="px-4 text-store-400 text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase">
            Place Your Order Via
          </span>
          <div className="h-px w-12 md:w-20 bg-gradient-to-l from-transparent to-store-500/30" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Call Card */}
          <a
            href={`tel:${contactNumber.replace(/\s+/g, '')}`}
            aria-label="Call to place order"
            className={cardBase}
            onMouseEnter={() => setHoveredCard("call")}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              borderColor: hoveredCard === "call" ? palette[500] : `${palette[500]}22`,
              backgroundColor: hoveredCard === "call" ? `${palette[500]}10` : "rgba(23, 23, 23, 0.4)",
              boxShadow: hoveredCard === "call" ? `0 0 20px -5px ${palette[500]}33` : "none",
            }}
          >
            <div className="relative mr-4">
              <div
                className="p-3.5 rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${palette[500]}, ${palette[700]})` }}
              >
                <FaPhoneVolume className="text-white text-xl" />
              </div>
            </div>
            <div className="relative flex flex-col">
              <span className="text-[11px] font-bold tracking-wide uppercase mb-0.5" style={{ color: palette[400] }}>
                Order via Call
              </span>
              <span className="text-white font-bold text-base md:text-lg leading-tight transition-colors">
                {contactNumber}
              </span>
            </div>
          </a>

          {/* WhatsApp Card */}
          {contactNumber && (
            <a
              href={`https://wa.me/${contactNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hello, I want to buy Medicine.")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact via WhatsApp"
              className={cardBase}
              onMouseEnter={() => setHoveredCard("whatsapp")}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                borderColor: hoveredCard === "whatsapp" ? "#10b981" : "rgba(16, 185, 129, 0.15)",
                backgroundColor: hoveredCard === "whatsapp" ? "rgba(16, 185, 129, 0.08)" : "rgba(23, 23, 23, 0.4)",
                boxShadow: hoveredCard === "whatsapp" ? "0 0 20px -5px rgba(16, 185, 129, 0.25)" : "none",
              }}
            >
              <div className="relative mr-4">
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-3.5 rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <FaWhatsapp className="text-white text-xl" />
                </div>
              </div>
              <div className="relative flex flex-col">
                <span className="text-[11px] text-emerald-400 font-bold tracking-wide uppercase mb-0.5">
                  Order via WhatsApp
                </span>
                <span className="text-white font-bold text-base md:text-lg leading-tight transition-colors">
                  WhatsApp
                </span>
              </div>
            </a>
          )}

          {/* Prescription Card */}
          <button
            onClick={() => setModalOpen(true)}
            className={`${cardBase} w-full text-left`}
            onMouseEnter={() => setHoveredCard("prescription")}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              borderColor: hoveredCard === "prescription" ? "#3b82f6" : "rgba(59, 130, 246, 0.15)",
              backgroundColor: hoveredCard === "prescription" ? "rgba(59, 130, 246, 0.08)" : "rgba(23, 23, 23, 0.4)",
              boxShadow: hoveredCard === "prescription" ? "0 0 20px -5px rgba(59, 130, 246, 0.25)" : "none",
            }}
          >
            <div className="relative mr-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3.5 rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                <FaFilePrescription className="text-white text-xl" />
              </div>
            </div>
            <div className="relative flex flex-col">
              <span className="text-[11px] text-blue-400 font-bold tracking-wide uppercase mb-0.5">
                Quick Upload
              </span>
              <span className="text-white font-bold text-base md:text-lg leading-tight transition-colors">
                Upload Prescription
              </span>
            </div>
          </button>
        </div>
      </div>

      <PrescriptionUploadModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
      />
    </>
  );
};

export default OrderOptions;
