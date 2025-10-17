import { useState, useEffect } from 'react';
import { Button } from '../../../../components/button';
import { Input, InputGroup } from '../../../../components/input';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  MinusIcon,
  XMarkIcon,
  BeakerIcon
} from '@heroicons/react/16/solid';
import { formatTZS, parseTZSToCents, validateTZSInput } from '../../../../utils/currency';
import walletService from '../../../../api/wallet-service';
import { formatProductData } from '../../../../utils/api-response';
import { LoadingDisplay } from './error-display';

export default function ProductSelector({ selectedItems, onItemsChange }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showProductList, setShowProductList] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(product =>
        product.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowProductList(true);
    } else {
      setFilteredProducts([]);
      setShowProductList(false);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      const response = await walletService.getAllProducts();
      if (response.success) {
        const formattedProducts = response.items
          .map(formatProductData)
          .filter(p => p && p.available_for_sale !== false);  
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product) => {
    const existingItem = selectedItems.find(item => item.item_id === product.item_id);
    
    if (existingItem) {
      // Increase quantity
      updateQuantity(product.item_id, existingItem.quantity + 1);
    } else {
      // Add new item
      const newItem = {
        item_id: product.item_id,
        variant_id: product.variant_id,
        description: product.item_name,
        quantity: 1,
        unit_price_cents: product.price_cents * 100,  
        line_total_cents: product.price_cents * 100,
        image_url: product.image_url
      };
      onItemsChange([...selectedItems, newItem]);
    }
    
    setSearchTerm('');
    setShowProductList(false);
  };

  const removeItem = (itemId) => {
    const updatedItems = selectedItems.filter(item => item.item_id !== itemId);
    onItemsChange(updatedItems);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = selectedItems.map(item => {
      if (item.item_id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          line_total_cents: item.unit_price_cents * newQuantity
        };
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const updatePrice = (itemId, newPriceCents) => {
    const updatedItems = selectedItems.map(item => {
      if (item.item_id === itemId) {
        return {
          ...item,
          unit_price_cents: newPriceCents,
          line_total_cents: newPriceCents * item.quantity
        };
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const handlePriceChange = (itemId, priceInput) => {
    if (priceInput === '') {
      updatePrice(itemId, 0);
      return;
    }
    
    const validation = validateTZSInput(priceInput);
    if (validation.isValid) {
      updatePrice(itemId, validation.amount);
    }
  };

  if (loading) {
    return <LoadingDisplay message="Loading products..." />;
  }

  return (
    <div className="space-y-4">
      {/* Product Search */}
      <div className="relative">
        <InputGroup>
          <MagnifyingGlassIcon />
          <Input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-black !text-black dark:!text-black"
            style={{ color: 'black' }}
          />
        </InputGroup>
        
        {/* Product Search Results */}
        {showProductList && filteredProducts.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredProducts.slice(0, 10).map((product) => (
              <div
                key={product.item_id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => addProduct(product)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.item_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <BeakerIcon className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-black">{product.item_name}</p>
                      {product.sku && (
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">TZS {(product.price_cents || 0).toLocaleString()}</p>
                    <Button size="sm" color="blue">
                      <PlusIcon className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* No Results */}
        {showProductList && filteredProducts.length === 0 && searchTerm.trim() && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <p className="text-black text-center">No products found for "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-black mb-3">Selected Items</h4>
          <div className="space-y-3">
            {selectedItems.map((item) => (
              <div key={item.item_id} className="bg-white p-3 rounded border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.description}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <BeakerIcon className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-black">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        outline
                        onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                      >
                        <MinusIcon className="h-3 w-3" />
                      </Button>
                      <span className="px-3 py-1 text-sm font-medium bg-gray-100 rounded text-black">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        outline
                        onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Price Input */}
                    <div className="w-24">
                      <Input
                        type="text"
                        value={formatTZS(item.unit_price_cents, false)}
                        onChange={(e) => handlePriceChange(item.item_id, e.target.value)}
                        className="text-right text-sm text-black"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="w-20 text-right">
                      <p className="font-semibold text-black">
                        {formatTZS(item.line_total_cents)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      size="sm"
                      color="red"
                      outline
                      onClick={() => removeItem(item.item_id)}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedItems.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <PlusIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No items selected</p>
          <p className="text-sm text-gray-500">Search and add products above</p>
        </div>
      )}
    </div>
  );
}