(function () {
  window.formatInr = function formatInr(amount) {
    const n = Number(amount);
    if (Number.isNaN(n)) return '₹0';
    return (
      '₹' +
      n.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    );
  };
})();
