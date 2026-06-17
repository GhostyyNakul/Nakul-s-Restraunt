export type Category = 'Burgers' | 'Pizzas' | 'Mojitos' | 'Combos' | 'Pasta' | 'Fries';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  bestSeller?: boolean;
  isVeg?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export type OrderStatus = 'Pending' | 'Stoking Flames' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  paymentMethod: 'cod' | 'online';
  status: OrderStatus;
  date: string;
  time?: string;
}

export interface Review {
  id: string;
  author: string;
  text: string;
  rating: number;
  avatarColor: string;
  date: string;
}
