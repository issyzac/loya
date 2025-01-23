
import React, {useContext, createContext, useState} from 'react';

const CurrentPageContext = createContext();
const UpdateCurrentPageContext = createContext();
const CustomerOrder= createContext();
const UpdateOrder = createContext();
const BuyNow = createContext();
const UpdateBuyNow = createContext();

export function useCurrentPage() {
  return useContext(CurrentPageContext);
}

export function useUpdateCurrentPage(){
  return useContext(UpdateCurrentPageContext);
}

export function useCustomerOrder(){
  return useContext(CustomerOrder);
}

export function useUpdateOrder(){
  return useContext(UpdateOrder);
}

export function useProductToBuy(){
  return useContext(BuyNow);
}

export function useUpdateProductToBuy(){
  return useContext(UpdateBuyNow);
}

export function AppProvider({children}) {

  let page = "Home";

  let order = {};

  const [currentPage, setCurrentPage] = useState(page);

  const [customerOrder, setOrder] = useState(order);

  const [productToBuy, setProductToBuy] = useState(false);

  function updateCurrentPage(page) {
    setCurrentPage(page);
  }

  function updateCustomerOrder(order){
    setOrder(order);
    setProductToBuy(false);
  }

  function updateProductToBuy(buyNow){
    setProductToBuy(buyNow);
  }

  return (
    <CurrentPageContext.Provider value={currentPage}>
      <UpdateCurrentPageContext.Provider value={updateCurrentPage}>
        <CustomerOrder.Provider value={customerOrder}>
          <UpdateOrder.Provider value={updateCustomerOrder}>
            <BuyNow.Provider value={productToBuy}>
              <UpdateBuyNow.Provider value={updateProductToBuy}>
                {children}
              </UpdateBuyNow.Provider>
            </BuyNow.Provider>
          </UpdateOrder.Provider>
        </CustomerOrder.Provider>
      </UpdateCurrentPageContext.Provider>
    </CurrentPageContext.Provider>
  );
}