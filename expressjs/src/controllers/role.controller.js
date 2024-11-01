const Role = require("../models/role.model");
const Bullier = require("../models/roles/bullier.model");
const Hunter = require("../models/roles/hunter.model");
const Stalker = require("../models/roles/stalker.model");
const Witch = require("../models/roles/witch.model");

const roleIndex = async (req, res) => {
  const roles = [new Bullier(), new Hunter(), new Stalker(), new Witch()];

  const roleInstances = roles.map((role) => new Role(role));

  return res.status(200).json({ roleInstances });
};

module.exports = roleIndex;
