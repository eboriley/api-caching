import axios from 'axios';
import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config({ silent: process.env.NODE_ENV === 'production' });

const redis = new Redis({
  port: 6379,
  host: '127.0.0.1',
});

const cityEndpoint = (city) =>
  `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${process.env.WEATHER_API_KEY}`;

const getWeather = async (city) => {
  //check if we have a cached value of the city weather we want
  let cacheEntry = await redis.get(`weather:${city}`);

  //if we have a cache hit
  if (cacheEntry) {
    cacheEntry = JSON.parse(cacheEntry);
    //returns that entry
    return { ...cacheEntry, source: 'cache' };
  }

  //we must ahve a cache miss
  //otherwise we are calling api for response
  let apiResponse = await axios.get(cityEndpoint(city));
  redis.set(
    `weather:${city}`,
    JSON.stringify(apiResponse.data),
    'EX',
    3600
  );
  return { ...apiResponse.data, source: 'API' };
};

const city = 'Nkawkaw';
const t0 = new Date().getTime();
let weather = await getWeather(city);
const t1 = new Date().getTime();
weather.responseTime = `${t1 - t0}ms`;
console.log(weather);
process.exit();
