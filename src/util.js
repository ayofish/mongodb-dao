export const cleanMongoId = (obj) => {
obj.id = obj._id.toHexString();
delete obj._id;
return obj;
};