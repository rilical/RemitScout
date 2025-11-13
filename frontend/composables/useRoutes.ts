export const useRoutes = () => {
  const goBack = () => {
    if (import.meta.client) {
      window.history.back();
    }
  };

  const goHome = () => {
    navigateTo('/');
  };

  const goToProviders = () => {
    navigateTo('/providers');
  };

  const goToSendMoney = () => {
    navigateTo('/send-money');
  };

  return {
    goBack,
    goHome,
    goToProviders,
    goToSendMoney,
  };
};
