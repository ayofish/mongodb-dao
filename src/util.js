export const cleanMongoId = (obj) => {
obj.id = obj._id;
delete obj._id;
return obj;
};