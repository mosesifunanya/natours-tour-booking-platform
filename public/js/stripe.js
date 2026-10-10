/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51UOJde2VYrDMSW2H0sUl7eIDfJUsv3iIr0eiw6TUUkpTMU8eLi3kpaaLv1lkiwU2eMjUVYW0qUnJo5WptA4wTPPl007MWZVNI9',
);

export const bookTour = async (tourId) => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
