'use strict'
const RESOURCE = require('../models/resource.model')
// const Resource = require('../models/mysql/resource.model')
// const { Role, Grant } = require('../models/mysql/role.model')
const ROLE = require('../models/role.model')
const sequelize = require("../dbs/sequelize");
const { BadRequestError, ErrorResponse } = require("../core/error.response");

/**
 * new resource
 * @param {string} name
 * @param {string} slug
 * @param {string} description
 */
const createResource = async ({
    name = 'profile',
    slug = 'p00001',
    description = ''
}) => {
    try {
        //1. Check name or slug exists

        //2. new resource
        const resource = await RESOURCE.create({
            name,
            slug,
            description
        })

        // mysql
        // const resource = await Resource.create({
        //     name,
        //     slug,
        //     description,
        // });

        return resource
    } catch (error) {
        console.log('error', error)
    }
}

const resourceList = async ({
    userId = 0, // admin
    limit = 30,
    offset = 0,
    search = ''
}) => {
    try {
        //1. Check admin? middleware function

        //2. get list or resource
        const resources = await RESOURCE.aggregate([
            {
                $project: {
                    _id: 0,
                    name: '$name',
                    slug: '$slug',
                    description: '$description',
                    resourceId: '$_id',
                    createAt: 1
                }
            },
        ])

        // mysql
        // const resources = await Resource.findAll({
        //     attributes: [
        //         'resourceId',
        //         'name',
        //         'slug',
        //         'description',
        //         'createdAt',
        //     ]
        // });

        return resources;
    } catch (error) {
        return []
    }
}

const createRole = async ({
    name = 'admin',
    slug = 's0001',
    description = 'extend from shop or user',
    grants = []
}) => {
    try {
        //1. check role exists

        //2. new role
        // mongodb
        const role = await ROLE.create({
            rol_name: name,
            rol_slug: slug,
            rol_description: description,
            rol_grants: grants
        })


        // mysql
        // create new role
        // const role = await Role.create({
        //     rol_name: name,
        //     rol_slug: slug,
        //     rol_description: description
        // });
        // if (grants && grants.length > 0) {
        //     const grantPromises = grants.map(grant =>
        //         Grant.create({
        //             roleId: role.id,
        //             resourceId: grant.resource,
        //             actions: JSON.stringify(grant.actions),
        //             attributes: grant.attributes
        //         })
        //     );
        //     await Promise.all(grantPromises);
        // }

        return role;
    } catch (error) {
        return new ErrorResponse(error, 400);
    }
}

const roleList = async ({
    userId = 0, // admin
    limit = 30,
    offset = 0,
    search = ''
}) => {
    try {
        // 1. userId
        // 2. list role

        const roles = await ROLE.aggregate([
            {
                $unwind: '$rol_grants'
            },
            {
                $lookup: {
                    from: 'resources',
                    localField: 'rol_grants.resource',
                    foreignField: '_id',
                    as: 'resource'
                }
            },
            {
                $unwind: '$resource'
            },
            {
                $project: {
                    role: '$rol_name',
                    resource: '$resource.name',
                    action: '$rol_grants.actions',
                    attribute: '$rol_grants.attributes'
                }
            },
            {
                $unwind: '$action'
            },
            {
                $project: {
                    _id: 0,
                    role: 1,
                    resource: 1,
                    action: '$action',
                    attribute: 1
                }
            }
        ])
        // console.log('roles', roles)
        return roles;
    } catch (error) {
        // return error
        return new ErrorResponse(error, 400);
    }
}

module.exports = {
    createResource,
    resourceList,
    createRole,
    roleList
}