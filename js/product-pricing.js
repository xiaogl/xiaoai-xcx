(function () {
  const tierFields = ['ordinaryPrice','silverPrice','goldPrice','diamondPrice'];
  const fields = ['listPrice','strikePrice','memberPrice','plusPrice', ...tierFields];
  const cents = value => Math.round(value * 100) / 100;
  function quote(product, delta, level, plus) {
    const sale = cents(product.price + delta);
    const configured = key => product[key] == null ? null : cents(product[key] + delta);
    let price = sale;
    if (level && product.member) {
      if (product.pricingMode === '自定义会员价') {
        const memberQuote = key => {
          const rate = product[key+'Discount'];
          return configured(key) ?? (rate == null ? null : cents(sale * rate / 10));
        };
        const tier = memberQuote(tierFields[level - 1]) ?? memberQuote('memberPrice') ?? sale;
        price = Math.min(sale, tier, plus ? memberQuote('plusPrice') ?? tier : tier);
      } else {
        const rate = plus || level >= 4 ? .9 : level >= 2 ? .95 : 1;
        price = rate === 1 ? sale : Math.round(sale * rate * 10) / 10;
      }
    }
    return {sale, price, list:configured('listPrice'), strike:configured('strikePrice') ?? (price < sale ? sale : null)};
  }
  function valid(product, deltas) {
    return ['price',...fields].every(key => {
      const v = product[key];
      return (key !== 'price' && v == null) || (Number.isFinite(v) && v >= 0 && Math.abs(cents(v)-v)<1e-8 && deltas.every(d=>Number.isFinite(d) && cents(v+d)>=0));
    }) && ['memberPrice','plusPrice',...tierFields].every(key => {
      const d=product[key+'Discount'];
      return d==null || (Number.isFinite(d) && d>0 && d<=10 && product[key]==null);
    }) && (product.strikePrice == null || product.strikePrice >= product.price);
  }
  const pricing = {quote, valid};
  if (typeof module === 'object' && module.exports) module.exports = pricing;
  else window.XA.productPricing = pricing;
})();
