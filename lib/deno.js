import Garden from './garden.js';

const gardens = new Garden();

export default Object.assign(
  gardens, {
    environment: {
      deno: Deno.version
    }
  });
