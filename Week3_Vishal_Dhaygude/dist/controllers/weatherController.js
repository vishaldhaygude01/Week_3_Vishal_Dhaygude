"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailWeatherData = exports.getWeatherDashboard = exports.saveWeatherMapping = void 0;
const axios_1 = __importDefault(require("axios"));
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const nodemailer_1 = __importDefault(require("nodemailer"));
const saveWeatherMapping = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = req.body;
        const weatherApiKey = process.env.WEATHER_API_KEY;
        for (const location of locations) {
            const geoResponse = yield axios_1.default.get(`https://api.openweathermap.org/data/2.5/weather?q=${location.city},${location.country}&appid=${weatherApiKey}`);
            console.log("GeoCoding API Response:", geoResponse.data);
            const { lat, lon } = geoResponse.data.coord;
            const weatherData = geoResponse.data.weather[0].description;
            const time = new Date();
            yield models_1.Weather.create({
                city: location.city,
                country: location.country,
                weather: weatherData,
                time: time,
                longitude: lon,
                latitude: lat,
            });
        }
        res.status(201).send("Weather data saved successfully.");
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error saving weather data.");
    }
});
exports.saveWeatherMapping = saveWeatherMapping;
const getWeatherDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { city } = req.query;
        if (typeof city === "string") {
            const weatherData = yield models_1.Weather.findAll({ where: { city } });
            res.json(weatherData);
        }
        else {
            const latestWeatherData = yield models_1.Weather.findAll({
                attributes: [
                    "city",
                    "country",
                    "weather",
                    "time",
                    "longitude",
                    "latitude",
                ],
                order: [["time", "DESC"]],
                group: ["city", "country", "weather", "time", "longitude", "latitude"],
                where: sequelize_1.Sequelize.literal(`
            (city, country, time) IN (
              SELECT city, country, MAX(time) as time
              FROM "Weather"
              GROUP BY city, country
            )
          `),
            });
            res.json(latestWeatherData);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching weather data.");
    }
});
exports.getWeatherDashboard = getWeatherDashboard;
const mailWeatherData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = req.body;
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: "vishalddummy01@gmail.com",
                pass: "nlch xlys ymqv uxss",
            },
        });
        let htmlContent = "<table><tr><th>City</th><th>Country</th><th>Weather</th><th>Time</th><th>Longitude</th><th>Latitude</th></tr>";
        for (const location of locations) {
            const weatherData = yield models_1.Weather.findOne({
                where: { city: location.city, country: location.country },
                order: [["time", "DESC"]],
            });
            if (weatherData) {
                htmlContent += `<tr><td>${weatherData.city}</td><td>${weatherData.country}</td><td>${weatherData.weather}</td><td>${weatherData.time}</td><td>${weatherData.longitude}</td><td>${weatherData.latitude}</td></tr>`;
            }
        }
        htmlContent += "</table>";
        const mailOptions = {
            from: "vishalddummy01@gmail.com",
            to: "vishaldhaigude0102@gmail.com",
            subject: "Weather Data",
            html: htmlContent,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                res.status(500).send("Error sending email.");
            }
            else {
                res.send("Email sent: " + info.response);
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error processing email request.");
    }
});
exports.mailWeatherData = mailWeatherData;
