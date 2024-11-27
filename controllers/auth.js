import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { jwt } from "../utils/index.js";

// Función de registro
async function register(req, res) {
    const { email, password } = req.body;

    const user = new User({
        email: email.toLowerCase(),
    });

    try {
        // Generar salt y hash para la contraseña
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(password, salt);
        user.password = hashPassword;

        // Guardar el usuario en la base de datos
        const userStorage = await user.save();
        res.status(201).send(userStorage); // Registro exitoso
    } catch (error) {
        console.log(error);
        res.status(400).send({ msg: "Error al registrar el usuario" }); // Error en el registro
    }
}

// Función de login
async function login(req, res) {
    const { email, password } = req.body;
    const emailLowerCase = email.toLowerCase();

    try {
        // Buscar usuario por email
        const userStorage = await User.findOne({ email: emailLowerCase });
        if (!userStorage) {
            return res.status(400).send({ msg: "Usuario no encontrado" }); // Usuario no encontrado
        }

        // Verificar contraseña
        const check = await bcrypt.compare(password, userStorage.password);
        if (!check) {
            return res.status(400).send({ msg: "Contraseña incorrecta" }); // Contraseña incorrecta
        }

        // Responder con tokens si la contraseña es correcta
        const accessToken = jwt.createAccessToken(userStorage);
        const refreshToken = jwt.createRefreshToken(userStorage);

        res.status(200).send({
            access: accessToken,
            refresh: refreshToken,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: "Error del servidor" }); // Error del servidor
    }
}

async function refreshAccessToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).send({ msg: "Token requerido" });
    }

    // Verificar si el token ha expirado
    const hasExpired = jwt.hasExpiredToken(refreshToken);

    if (hasExpired) {
        return res.status(400).send({ msg: "Token expirado" });
    }

    try {
        // Decodificar el token para obtener el user_id
        const { user_id } = jwt.decoded(refreshToken);

        // Buscar al usuario por su ID
        const userStorage = await User.findById(user_id);

        if (!userStorage) {
            return res.status(400).send({ msg: "Usuario no encontrado" });
        }

        // Si el usuario existe, crear un nuevo access token
        const newAccessToken = jwt.createAccessToken(userStorage);

        // Enviar la respuesta con el nuevo access token
        res.status(200).send({
            accessToken: newAccessToken,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: "Error del servidor" });
    }
}



export const AuthController = {
    register,
    login,
    refreshAccessToken,
};
