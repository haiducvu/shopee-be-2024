'use strict'

const { AuFailureError } = require('../core/error.response')
const { roleList } = require('../services/rbac.service')
const rbac = require('./role.middleware')

/**
 * 
 * @param {string} action // read, delete or update
 * @param {*} resource // profile, balance/ ..
 */
const grantAccess = (action, resource) => {
    return async (req, res, next) => {
        try {
            const roles = await roleList(
                {
                    userId: 999
                }
            )
            rbac.setGrants(roles)
            const rol_name = req.query.role;
            const permission = rbac.can(rol_name)[action](resource);
            console.log('permission', permission)
            if (!permission.granted) {
                throw new AuFailureError('You dont have permission to perform this action')
            }
            next();
        } catch (error) {
            next(error)
        }
    }
}

module.exports = {
    grantAccess
}