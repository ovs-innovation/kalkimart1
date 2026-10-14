import useTranslation from "next-translate/useTranslation";

const Stock = ({ stock, card }) => {
  const { t } = useTranslation();

  return (
    <>
      {stock <= 0 ? (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-950/70 text-red-400 border border-red-500/30 ${card ? "absolute z-10" : ""}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          {t("stockOut")}
        </span>
      ) : (
        <span
          className={`${
            card
              ? "absolute z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
              : "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{t("stock")} :</span>
          <span className={`font-bold ${stock <= 10 ? "text-amber-400" : "text-emerald-300"}`}>
            {Math.max(0, stock)}
          </span>
          {stock <= 10 && (
            <span className="text-[10px] text-amber-300 ml-1 font-semibold animate-pulse">
              (Low Stock)
            </span>
          )}
        </span>
      )}
    </>
  );
};

export default Stock;
