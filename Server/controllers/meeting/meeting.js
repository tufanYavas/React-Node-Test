const Meetings = require('../../model/schema/meeting')
const mongoose = require('mongoose');
const User = require('../../model/schema/user')

const add = async (req, res) => {
    try {
        const { agenda, attendes, attendesLead, location, related, dateTime, notes } = req.body;

        if (!agenda) {
            return res.status(400).json({ message: 'error', err: 'Agenda is required' });
        }

        const meeting = new Meetings({
            agenda,
            attendes,
            attendesLead,
            location,
            related,
            dateTime,
            notes,
            createBy: req.user.userId
        });

        await meeting.save();

        return res.send(meeting);
    } catch (error) {
        console.error('Failed to add meeting:', error);
        return res.status(400).json({ message: 'error', err: error.toString() });
    }
}

const index = async (req, res) => {
    try {
        const { createBy } = req.query;

        // Create filtering condition
        const filter = { deleted: false };

        const user = await User.findById(req.user.userId)
        if (user?.role !== "superAdmin") {
            if (!createBy) {
                return res.status(400).json({ message: 'error', err: 'createBy is required' });
            }
            filter.createBy = createBy;
        }

        const meetings = await Meetings.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'Contacts',
                    localField: 'attendes',
                    foreignField: '_id',
                    as: 'attendes'
                }
            },
            {
                $lookup: {
                    from: 'Leads',
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'attendesLead'
                }
            },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] }
                }
            },
            { $sort: { timestamp: -1 } }
        ]);

        return res.send(meetings);
    } catch (error) {
        console.error('Error fetching meetings:', error);
        return res.status(400).json({ message: 'error', err: 'Something went wrong' });
    }
}

const view = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'error', err: 'Invalid meeting ID' });
        }

        const meetings = await Meetings.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                    deleted: false
                }
            },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'Contacts',
                    localField: 'attendes',
                    foreignField: '_id',
                    as: 'attendes'
                }
            },
            {
                $lookup: {
                    from: 'Leads',
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'attendesLead'
                }
            },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] }
                }
            }
        ]);

        if (!meetings || meetings.length === 0) {
            return res.status(404).json({ message: 'No Data Found.' });
        }

        return res.send(meetings[0]);
    } catch (error) {
        console.error('Failed to display meeting:', error);
        return res.status(400).json({ message: 'Failed to display', error: error.toString() });
    }
}

const deleteData = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'error', err: 'Invalid meeting ID' });
        }

        const meeting = await Meetings.findOneAndUpdate(
            { _id: id },
            { deleted: true }
        );

        if (!meeting) {
            return res.status(404).json({ message: 'error', err: 'No Data Found.' });
        }

        return res.status(200).json({ message: 'done', result: meeting });
    } catch (error) {
        console.error('Failed to delete meeting:', error);
        return res.status(400).json({ message: 'Failed to delete', error: error.toString() });
    }
}

const deleteMany = async (req, res) => {
    try {
        const ids = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'error', err: 'Valid meeting IDs array is required' });
        }

        const result = await Meetings.updateMany(
            { _id: { $in: ids } },
            { deleted: true }
        );

        return res.status(200).json({ message: 'done', result });
    } catch (error) {
        console.error('Failed to delete meetings:', error);
        return res.status(400).json({ message: 'Failed to delete meetings', error: error.toString() });
    }
}

module.exports = { add, index, view, deleteData, deleteMany }