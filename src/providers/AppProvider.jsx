
import React, {useContext, createContext, useState} from 'react';

const CurrentPageContext = createContext();
const UpdateCurrentPageContext = createContext();
const CustomerOrder= createContext();
const UpdateOrder = createContext();
const BuyNow = createContext();
const UpdateBuyNow = createContext();
const RemovedItems = createContext();
const UpdateRemovedItems = createContext();

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

export function useRemovedItems() {
    return useContext(RemovedItems);
}

export function useUpdateRemovedItems() {
    return useContext(UpdateRemovedItems);
}

export function AppProvider({children}) {

  let page = "Home";

  const [currentPage, setCurrentPage] = useState(page);

  const [customerOrder, setOrder] = useState([]);

  const [productToBuy, setProductToBuy] = useState(false);

  const [removedItems, setRemovedItems] = useState([]);

  function updateCurrentPage(page) {
    setCurrentPage(page);
  }

  function updateCustomerOrder(order){
    setOrder(prevOrder => [...prevOrder, order]);
    setProductToBuy(false);
  }

  function removeCustomerOrder(orderId){
    const itemToRemove = customerOrder.find(item => item.slip_id === orderId);
    setRemovedItems(prevRemoved => [...prevRemoved, itemToRemove]);
    setOrder(prevOrder => prevOrder.filter(item => item.slip_id !== orderId));
  }

  function clearRemovedItems() {
    setRemovedItems([]);
  }

  function clearCartAndRemovedItems() {
    setOrder([]);
    setRemovedItems([]);
  }

  function updateProductToBuy(buyNow){
    setProductToBuy(buyNow);
  }

  return (
    <CurrentPageContext.Provider value={currentPage}>
      <UpdateCurrentPageContext.Provider value={updateCurrentPage}>
        <CustomerOrder.Provider value={customerOrder}>
          <UpdateOrder.Provider value={{updateCustomerOrder, removeCustomerOrder}}>
            <BuyNow.Provider value={productToBuy}>
              <UpdateBuyNow.Provider value={updateProductToBuy}>
                <RemovedItems.Provider value={removedItems}>
                    <UpdateRemovedItems.Provider value={{clearRemovedItems, clearCartAndRemovedItems}}>
                        {children}
                    </UpdateRemovedItems.Provider>
                </RemovedItems.Provider>
              </UpdateBuyNow.Provider>
            </BuyNow.Provider>
          </UpdateOrder.Provider>
        </CustomerOrder.Provider>
      </UpdateCurrentPageContext.Provider>
    </CurrentPageContext.Provider>
  );
}