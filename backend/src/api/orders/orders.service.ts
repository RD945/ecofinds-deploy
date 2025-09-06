import { Prisma, PrismaClient } from '@prisma/client';
import { clearCart, getCart } from '../cart/cart.service';

const prisma = new PrismaClient();

export async function getOrderHistory(userId: number) {
    return prisma.order.findMany({
        where: { user_id: userId },
        include: {
            orderItems: {
                include: {
                    product: true,
                }
            }
        },
        orderBy: {
            order_date: 'desc'
        }
    });
}

interface DeliveryLocation {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}

export async function createOrder(userId: number, deliveryLocation?: DeliveryLocation) {
    const cartItems = await getCart(userId);

    if (cartItems.length === 0) {
        return null;
    }

    const totalAmount = cartItems.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const orderData: Prisma.OrderCreateInput = {
        user: { connect: { id: userId } },
        total_amount: new Prisma.Decimal(totalAmount),
        orderItems: {
            create: cartItems.map(item => ({
                product: { connect: { id: item.product_id } },
                quantity: item.quantity,
                price: new Prisma.Decimal(item.product.price)
            }))
        }
    };

    // Add delivery location if provided
    if (deliveryLocation) {
        orderData.delivery_address = deliveryLocation.address;
        orderData.delivery_city = deliveryLocation.city;
        orderData.delivery_state = deliveryLocation.state;
        orderData.delivery_postal_code = deliveryLocation.postalCode;
        orderData.delivery_country = deliveryLocation.country;
        orderData.delivery_latitude = new Prisma.Decimal(deliveryLocation.coordinates.lat);
        orderData.delivery_longitude = new Prisma.Decimal(deliveryLocation.coordinates.lng);
    }

    const order = await prisma.order.create({
        data: orderData,
        include: {
            orderItems: true
        }
    });

    await clearCart(userId);

    return order;
}
