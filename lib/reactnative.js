import Garden from './garden';

const gardens = new Garden();

export default Object.assign(
  gardens, {
    environment: {
      reactNative: navigator.product === 'ReactNative'
    }
  });
