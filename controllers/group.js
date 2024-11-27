import { User, Group, GroupMessage } from "../models/index.js";
import { getFilePath } from "../utils/index.js";

// Crear un nuevo grupo
async function create(req, res) {
  const { user_id } = req.user;
  const group = new Group(req.body);
  group.creator = user_id;
  group.participants = JSON.parse(req.body.participants);
  group.participants = [...group.participants, user_id];

  // Si hay una imagen en la solicitud, procesa su ruta
  if (req.files.image) {
    const imagePath = getFilePath(req.files.image); // Asegura que la imagen del grupo se guarde correctamente
    group.image = imagePath; // Asigna la ruta correcta de la imagen
  }

  try {
    // Guarda el grupo en la base de datos
    const groupStorage = await group.save();

    // Verifica si se creó correctamente
    if (!groupStorage) {
      res.status(400).send({ msg: "Error al crear el grupo" });
    } else {
      res.status(201).send(groupStorage);
    }
  } catch (error) {
    // Maneja cualquier error de servidor
    console.error(error);
    res.status(500).send({ msg: "Error del servidor" });
  }
}

// Obtener todos los grupos del usuario
async function getAll(req, res) {
  const { user_id } = req.user;

  try {
    // Obtiene los grupos que el usuario es participante
    const groups = await Group.find({ participants: user_id })
      .populate("creator")
      .populate("participants");

    const arrayGroups = [];
    
    // Itera sobre los grupos y obtiene el último mensaje de cada uno
    for (const group of groups) {
      const response = await GroupMessage.findOne({ group: group._id }).sort({
        createdAt: -1,
      });

      arrayGroups.push({
        ...group._doc,
        last_message_date: response?.createdAt || null,
      });
    }

    // Devuelve la respuesta con los grupos y la fecha del último mensaje
    res.status(200).send(arrayGroups);
  } catch (error) {
    // Maneja errores
    res.status(500).send({ msg: "Error al obtener los grupos" });
  }
}  

// Obtener un grupo específico
async function getGroup(req, res) {
  const group_id = req.params.id;

  try {
    // Realiza la búsqueda sin callback usando await
    const groupStorage = await Group.findById(group_id).populate("participants");

    if (!groupStorage) {
      // Responde con un 404 si no encuentra el grupo
      return res.status(404).send({ msg: "No se ha encontrado el grupo" });
    }

    // Responde con el grupo si lo encuentra
    res.status(200).send(groupStorage);
  } catch (error) {
    // Manejo de errores en caso de que falle la consulta
    res.status(500).send({ msg: "Error del servidor" });
  }
}

// Actualizar el nombre o la imagen de un grupo
async function updateGroup(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  try {
    // Obtén el grupo por su ID
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).send({ msg: "No se ha encontrado el grupo" });
    }

    // Actualiza el nombre si está presente
    if (name) group.name = name;

    // Actualiza la imagen si está presente en la solicitud
    if (req.files.image) {
      const imagePath = getFilePath(req.files.image); // Asegura que la imagen del grupo se guarde en la carpeta 'group/'
      group.image = imagePath; // Asigna la nueva imagen al grupo
    }

    // Guarda los cambios en la base de datos
    const updatedGroup = await Group.findByIdAndUpdate(id, group, { new: true });
    res.status(200).send({ image: updatedGroup.image, name: updatedGroup.name });
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
}

// Salir de un grupo
async function exitGroup(req, res) {
  const { id } = req.params;
  const { user_id } = req.user;

  const group = await Group.findById(id);

  const newParticipants = group.participants.filter(
    (participant) => participant.toString() !== user_id
  );

  const newData = {
    ...group._doc,
    participants: newParticipants,
  };

  await Group.findByIdAndUpdate(id, newData);

  res.status(200).send({ msg: "Salida exitosa" });
}

// Añadir participantes a un grupo
async function addParticipants(req, res) {
  const { id } = req.params;
  const { users_id } = req.body;

  const group = await Group.findById(id);
  const users = await User.find({ _id: users_id });

  console.log(users_id);

  const arrayObjectIds = [];
  users.forEach((user) => {
    arrayObjectIds.push(user._id);
  });

  const newData = {
    ...group._doc,
    participants: [...group.participants, ...arrayObjectIds],
  };

  await Group.findByIdAndUpdate(id, newData);

  res.status(200).send({ msg: "Participantes añadidos correctamente" });
}

// Eliminar un participante de un grupo
async function banParticipant(req, res) {
  const { group_id, user_id } = req.body; // ID del grupo y del participante a eliminar
  const { user_id: currentUserId } = req.user; // ID del usuario que hace la solicitud

  try {
    // Obtén el grupo por su ID
    const group = await Group.findById(group_id);

    // Verifica si el usuario que hace la solicitud es el creador del grupo
    if (group.creator.toString() !== currentUserId.toString()) {
      return res.status(403).send({ msg: "No tienes permiso para eliminar participantes" });
    }

    // Filtra los participantes para eliminar al usuario especificado
    const newParticipants = group.participants.filter(
      (participant) => participant.toString() !== user_id
    );

    // Actualiza el grupo con la nueva lista de participantes
    group.participants = newParticipants;
    await group.save();

    res.status(200).send({ msg: "Participante eliminado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Error del servidor" });
  }
}

// Exporta todos los controladores
export const GroupController = {
  create,
  getAll,
  getGroup,
  updateGroup,
  exitGroup,
  addParticipants,
  banParticipant,
};
