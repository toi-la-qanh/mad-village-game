const assignTypesOfRole = (numPlayers) => {
  const types = [];

  if (numPlayers < 8) {
    types.push("good"); 
    types.push("bad"); 
    for (let i = 2; i < numPlayers; i++) {
      types.push("mad"); 
    }
  }

  return types;
};

const rules = (type, status) => {

}