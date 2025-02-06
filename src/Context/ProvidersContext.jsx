import React, { createContext, useReducer } from "react";

export const ProvidersContext = createContext();

const initialState = {
  providers: [
    {
      id: 1,
      providerName: "WorldRemit",
      images: ["/logos/WorldRemit_logo.svg.png"],
      fee: 3.99,
      exchangeRate: 1.05,
      estimatedTime: "1-2 business days",
      paymentMode: "bank",
      website: "https://www.worldremit.com",
    },
    {
      id: 2,
      providerName: "Remitly",
      images: ["/logos/Remitly_idC-entTwe_0.svg"],
      fee: 3.99,
      exchangeRate: 0.95,
      estimatedTime: "3-5 business days",
      paymentMode: "bank",
      website: "https://www.remitly.com",
    },
    {
      id: 3,
      providerName: "Xe",
      images: ["/logos/Xe-logo.png"],
      fee: 4.50,
      exchangeRate: 1.02,
      estimatedTime: "2-3 business days",
      paymentMode: "bank",
      website: "https://www.xe.com",
    },
    {
      id: 4,
      providerName: "Wise",
      images: ["/logos/Wise_Symbol_0.svg"],
      fee: 4.95,
      exchangeRate: 1.03,
      estimatedTime: "1-2 business days",
      paymentMode: "bank",
      website: "https://wise.com",
    },
    {
      id: 5,
      providerName: "Western Union",
      images: ["/logos/free-western-union-logo-icon-19537-thumb-2.png"],
      fee: 0.00,
      exchangeRate: 0.89,
      estimatedTime: "Within minutes",
      paymentMode: "cash",
      website: "https://www.westernunion.com",
    },
    {
      id: 6,
      providerName: "MoneyGram",
      images: ["/logos/MONEYGRAM.webp"],
      fee: 0.00,
      exchangeRate: 0.90,
      estimatedTime: "Same day",
      paymentMode: "cash",
      website: "https://www.moneygram.com",
    }
  ],
  favorites: [],
};

const providersReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TO_FAVORITES":
      return {
        ...state,
        favorites: [...state.favorites, action.payload],
      };

    case "REMOVE_FROM_FAVORITES":
      return {
        ...state,
        favorites: state.favorites.filter(
          (item) => item.id !== action.payload.id
        ),
      };

    case 'SET_PROVIDERS':
      return {
        ...state,
        providers: action.payload
      };

    default:
      return state;
  }
};

export const ProvidersProvider = ({ children }) => {
  const [state, dispatch] = useReducer(providersReducer, initialState);

  return (
    <ProvidersContext.Provider value={{ state, dispatch }}>
      {children}
    </ProvidersContext.Provider>
  );
};

export default ProvidersProvider; 