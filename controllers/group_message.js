import { GroupMessage } from "../models/index.js";
import { io, getFilePath } from "../utils/index.js";


async function sendText(req, res) {
  const { group_id, message } = req.body;
  const { user_id } = req.user;

  try {
    // Crear un nuevo mensaje de grupo
    const group_message = new GroupMessage({
      group: group_id,
      user: user_id,
      message,
      type: "TEXT",
    });

    // Guardar el mensaje en la base de datos
    const savedMessage = await group_message.save();

    // Rellenar la información del usuario
    const data = await savedMessage.populate("user");

    // Emitir el mensaje a todos los miembros del grupo
    io.sockets.in(group_id).emit("message", data);
    io.sockets.in(`${group_id}_notify`).emit("message_notify", data);

    // Responder con éxito
    res.status(201).send({});
  } catch (error) {
    // Manejo de errores
    res.status(500).send({ msg: "Error del servidor" });
  }
}

async function sendImage(req, res) {
  const { group_id } = req.body;
  const { user_id } = req.user;
  const imagePath = getFilePath(req.files.image);

  const group_message = new GroupMessage({
    group: group_id,
    user: user_id,
    message: imagePath,  // Asumiendo que el mensaje es el path de la imagen
    type: "IMAGE",
  });

  try {
    // Guardar el mensaje de imagen en la base de datos
    const savedMessage = await group_message.save();

    // Rellenar la información del usuario
    const data = await savedMessage.populate("user");

    // Emitir el mensaje a todos los miembros del grupo
    io.sockets.in(group_id).emit("message", data);
    io.sockets.in(`${group_id}_notify`).emit("message_notify", data);

    // Responder con éxito
    res.status(201).send({});
  } catch (error) {
    // Manejo de errores
    res.status(500).send({ msg: "Error al enviar la imagen" });
  }
}

async function getAll(req, res) {
  const { group_id } = req.params;

  try {
    const messages = await GroupMessage.find({ group: group_id })
      .sort({ createdAt: 1 })
      .populate("user");

    const total = await GroupMessage.find({ group: group_id }).countDocuments();

    res.status(200).send({ messages, total });
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
}

async function getTotalMessages(req, res) {
  const { group_id } = req.params;

  try {
    const total = await GroupMessage.find({ group: group_id }).countDocuments();
    res.status(200).send(JSON.stringify(total));
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
}


async function getLastMessage(req, res) {
  const { group_id } = req.params;

  try {
    const response = await GroupMessage.findOne({ group: group_id })
      .sort({ createdAt: -1 })
      .populate("user");

    res.status(200).send(response || {});
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
}



export const GroupMessageController = {
  sendText,
  sendImage,
  getAll,
  getTotalMessages,
  getLastMessage,
  };
  