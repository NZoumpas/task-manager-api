const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

//task database
router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,//Τελεστής με αίτημα κουκκίδας που πρόκειται να αντιγράψει όλες τις ιδιότητες από το σώμα σε αυτό το αντικείμενο.
        owner: req.user._id
    })
    /*
    Έτσι, με αυτό που ισχύει όταν δημιουργούνται νέες εργασίες, δεν λαμβάνουμε απλώς 
    τα δεδομένα του σώματος και τα αποθηκεύουμε προσθέτουμε την ιδιοκτησία του κατόχου 
    για να δημιουργήσουμε πραγματικά αυτόν τον συσχετισμό.
    */
    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})
//GET /tasks?completed= true
//GET /tasks?limit=10
//GET /tasks?limit=2#skip=2 δηλ. δωσε 2(limit=2) και ξεκινα απο το δευτερο(skip=2)
// limit skip
//GEt /tasks?sortBy=createdAt:esc of desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1//ternary operator is true (-1) is false(1)
    }
    try {
        // const tasks = await Task.find({})
        // const tasks = await Task.find({ owner: req.user._id })
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req,res) => {
    const _id = req.params.id
    try {
        // const task = await Task.findById(_id)
        const task = await Task.findOne({ _id, owner: req.user._id})
        
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Updates!' })
    }
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true })
        // const task = await Task.findById(req.params.id)

        
        
        if (!task) {
            return res.status(404).send()
        }
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async(req, res) => {//response tasks .. call id
    try {
        // const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router