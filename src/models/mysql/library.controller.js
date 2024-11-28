"use strict";

const { SuccessResponse } = require("../../core/success.response");
// const { Author, Category, Book, Tag } = require("./library.model");

class LibraryController {
    addAuthor = async (req, res, next) => {
        console.log(req.body);
        const { name } = req.body;
        new SuccessResponse({
            message: "Create new Author Success",
            metadata: await Author.create({ name }),//this.addAuthorService(req.body),
        }).send(res);
    };

    addCategory = async (req, res, next) => {
        const { name } = req.body;
        new SuccessResponse({
            message: "Create new Category Success",
            metadata: await Category.create({ name }),
        }).send(res);
    };

    addBook = async (req, res, next) => {
        const { title, authorId, categoryId } = req.body;
        new SuccessResponse({
            message: "Create new Book Success",
            metadata: await Book.create({ title, authorId, categoryId }),
        }).send(res);
    };

    addTag = async (req, res, next) => {
        const { name } = req.body;
        new SuccessResponse({
            message: "Create new Tag Success",
            metadata: await Tag.create({ name }),
        }).send(res);
    };

    addBookTag = async (req, res, next) => {
        const { bookId, tagId } = req.body;
        const book = await Book.findByPk(bookId);
        const tag = await Tag.findByPk(tagId);
        if (!book || !tag) {
            throw new Error("Book or Tag not found");
        }
        new SuccessResponse({
            message: "Create new Book Tag Success",
            metadata: await book.addTag(tag),
        }).send(res);
    };

    getAuthor = async (req, res, next) => {
        const authors = await Author.findAll({
            include: [Book],
        });
        new SuccessResponse({
            message: "Get Authors Success",
            metadata: authors,
        }).send(res);
    };

    getBook = async (req, res, next) => {
        const books = await Book.findAll({
            include: [Author],
        });
        new SuccessResponse({
            message: "Get Book Success",
            metadata: books,
        }).send(res);
    };
}

module.exports = new LibraryController();
