const express = require("express");
const router = express.Router();

const Lead = require("../models/Lead");

router.get("/test", (req, res) => {
  res.json({
    message: "Lead routes are working"
  });
});uu


router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      source = "",
      sort = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

  
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }


    if (status) {
      query.status = status;
    }

 
    if (source) {
      query.source = source;
    }

    
    let sortOption = {};

    if (sort === "nameAsc") {
      sortOption = { name: 1 };
    } else if (sort === "nameDesc") {
      sortOption = { name: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const leads = await Lead.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      data: leads,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.post("/", async (req, res) => {
  try {
    const {
      name,
      company,
      email,
      phone,
      source,
      status,
      notes,
      nextFollowUp,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const lead = await Lead.create({
      name,
      company,
      email,
      phone,
      source,
      status,
      notes,
      nextFollowUp,
    });

    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE /api/leads/:id
router.delete("/:id", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;