import { Group, User } from "../models/index.js";
import { getFilePath } from "../utils/index.js";


async function getMe(req, res) {
  const { user_id } = req.user;

  try {
    const response = await User.findById(user_id).select(["-password"]);

    if (!response) {
      res.status(400).send({ msg: "No se ha encontrado el usuario" });
    } else {
      res.status(200).send(response);
    }
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
}

async function getUsers(req, res) {
  try {
    const { user_id } = req.user;
    const users = await User.find({ _id: { $ne: user_id } }).select([
      "-password",
    ]);

    if (!users) {
      res.status(400).send({ msg: "No se han encontardo usuarios" });
    } else {
      res.status(200).send(users);
    }
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
}

async function getUser(req, res) {
  const { id } = req.params;

  try {
    const response = await User.findById(id).select(["-password"]);

    if (!response) {
      res.status(400).send({ msg: "No se ha encontrado el usuario" });
    } else {
      res.status(200).send(response);
    }
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
}

const updateUser = async (req, res) => {
  const { user_id } = req.user; // Asume que `req.user` contiene el ID del usuario autenticado
  const userData = req.body;

  // Procesar la imagen si se incluye en la solicitud
  if (req.files?.avatar) {
    const imagePath = getFilePath(req.files.avatar);
    userData.avatar = imagePath; // Agregar la ruta de la imagen al objeto de actualización
  }

  try {
    // Actualizar el usuario y devolver los datos actualizados
    const user = await User.findByIdAndUpdate(
      user_id, 
      userData, 
      { new: true } // Esto asegura que obtengas el usuario actualizado
    );

    // Enviar solo los datos relevantes en la respuesta
    const response = {
      avatar: user.avatar,
      ...(userData.firstname && { firstname: user.firstname }),
      ...(userData.lastname && { lastname: user.lastname }),
    };

    res.status(200).send(response);
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    res.status(400).send({ msg: "Error al actualizar el usuario" });
  }
};


async function getUsersExeptParticipantsGroup(req, res) {
  const { group_id } = req.params;

  const group = await Group.findById(group_id);
  const participantsStrings = group.participants.toString();
  const participants = participantsStrings.split(",");

  const response = await User.find({ _id: { $nin: participants } }).select([
    "-password",
  ]);

  if (!response) {
    res.status(400).sedn({ msg: "No se ha encontrado ningun usuario" });
  } else {
    res.status(200).send(response);
  }
}




export const UserController = {
  getMe,
  getUsers,
  getUser,
  updateUser,
  getUsersExeptParticipantsGroup,
};
