import { Team } from "../models/teamModel.js"
import { User } from "../models/userModel.js";

export const createTeamController = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ msg: 'Team name is required' });
    }

    const newTeam = await Team.create({
      name,
      description,
      members: [{
        user: userId,
        role: 'Owner'
      }]
    });

    await User.findByIdAndUpdate(userId, {
        $addToSet: { teams: newTeam._id }
      });

    return res.status(201).json({
        msg: 'Team created successfully',
      team: newTeam
    });
  } catch (err) {
    console.error('Error creating team:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};   /// WORKS FINE SO FAR


export const getTeamController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate({
        path: 'members.user',
        select: 'name email role'
      })
      .lean();

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    
    let role = 'Member';
    let isMember = false;

    for (const member of team.members) {
      if (member.user._id.toString() === userId.toString()) {
        isMember = true;
        if (member.role === 'Owner' || member.role === 'Manager') {
          role = member.role;
        }
        break;
      }
    }

    if (!isMember) {
      return res.status(403).json({ msg: 'You are not a member of this team' });
    }

    team.canManage = role === 'Owner' || role === 'Manager';
    team.viewerRole = role;

    return res.status(200).json({ team });
  } catch (err) {
    console.error('Error fetching team:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};


export const getJoinedTeamController = async (req, res) => {
  try {
    const userId = req.user._id;
    

    const user = await User.findById(userId)
      .select('teams') 
      .populate({
        path: 'teams',
        populate: {
          path: 'members.user',
          select: 'name email role'
        }
      })
      .lean();

    if (!user || !user.teams) {
      return res.status(404).json({ msg: 'No teams found' });
    }

    return res.status(200).json({ teams: user.teams });
  } catch (err) {
    console.error('Error fetching joined teams:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}; // WORKS FINE FOR NOW


export const removeMemberController = async (req, res) => {
  try {
    const actingUserId = req.user._id; // User making the request
    const { teamId, memberId } = req.params;

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

   
    const actingMember = team.members.find(m => m.user.toString() === actingUserId.toString());
    const targetMember = team.members.find(m => m.user.toString() === memberId.toString());

    if (!actingMember || !targetMember) {
      return res.status(403).json({ error: 'Both users must be part of the team' });
    }

    if ( actingMember.role === 'Contributor' ) return res.status(403).json({ msg: 'Unathorized to remove member' });

    // Owner cannot be removed
    if (targetMember.role === 'Owner') {
      return res.status(403).json({ msg: 'Owner cannot be removed from the team' });
    }

    // Manager can only be removed by Owner
    if (targetMember.role === 'Manager' && actingMember.role !== 'Owner') {
      return res.status(403).json({ msg: 'Only Owner can remove a Manager' });
    }

    // Member can be removed by Manager or Owner
    if (targetMember.role === 'Contributor' && !['Owner', 'Manager'].includes(actingMember.role)) {
      return res.status(403).json({ msg: 'Only Manager or Owner can remove a Member' });
    }

    // Remove from team.members array
    team.members = team.members.filter(m => m.user.toString() !== memberId.toString());
    await team.save();

    // Also remove team from user's record
    await User.findByIdAndUpdate(memberId, {
      $pull: { teams: team._id }
    });

    // in future add method to remove assigned projects as well

    return res.status(200).json({ msg: 'Member removed successfully' });
  } catch (err) {
    console.error('Error removing member:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};



export const addMemberController = async (req, res) => {
    try {
      const actingUserId = req.user._id; 
      const { teamId } = req.params;
      const { memberEmail } = req.body;
  
      if (!memberEmail) {
        return res.status(400).json({ msg: 'Contributor email is required' });
      }
  
      // Use findOne, not find
      const userToBeAdded = await User.findOne({ email: memberEmail });

  
      if (!userToBeAdded) {
        return res.status(400).json({ msg: 'User not found' });
      }
  
      const newUserId = userToBeAdded._id;
  
      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ msg: 'Team not found' });
  
      const actingMember = team.members.find(m => m.user.toString() === actingUserId.toString());
  
      if (!actingMember || !['Owner', 'Manager'].includes(actingMember.role)) {
        return res.status(403).json({ error: 'Only Manager or Owner can add members' });
      }
  
      const alreadyMember = team.members.find(m => m.user.toString() === newUserId.toString());
      if (alreadyMember) {
        return res.status(400).json({ error: 'User is already a contributor of this team' });
      }
  
      // Add user to team
      team.members.push({ user: newUserId, role: 'Contributor' });
      await team.save();
  
      // Add team to user's team list if not already there
      await User.findByIdAndUpdate(newUserId, {
        $addToSet: { teams: team._id }
      });
  
      return res.status(200).json({ msg: 'Contributor added successfully', teamId: team._id });
    } catch (err) {
      console.error('Error adding member:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  };
  

export const assignRoleController = async (req, res) => {
    try {
      const actingUserId = req.user._id;
      const { teamId, memberId } = req.params;
      const { newRole } = req.body;
  
      if (!['Manager', 'Contributor'].includes(newRole)) {
        return res.status(400).json({ msg: 'Invalid role. Only "Manager" or "Contributor" roles are allowed.' });
      }
  
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ msg: 'Team not found' });
      }
  
      // check if the acting user is the Owner
      const actingMember = team.members.find(m => m.user.toString() === actingUserId.toString());

      if (!actingMember || actingMember.role !== 'Owner') {
        return res.status(403).json({ msg: 'Only the Owner can assign roles' });
      }
  
      // Check if the target user exists in the team
      const targetMember = team.members.find(m => m.user.toString() === memberId.toString());
      if (!targetMember) {
        return res.status(404).json({ msg: 'Target user is not a member of the team' });
      }
  
      // Prevent assigning Owner role
      if (newRole === 'Owner') {
        return res.status(403).json({ msg: 'Unauthorized' });
      }
  
      // Update the role
      targetMember.role = newRole;
      await team.save();
      
      return res.status(200).json({ msg: 'Role updated successfully' });
    } catch (err) {
      console.error('Error assigning role:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  };
  

// Search for teams by name
export const searchTeams = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    // Find teams that match the query and where the user is a member
    const teams = await Team.find({
      name: { $regex: query, $options: 'i' },
      'members.user': userId
    }).select('name description');

    return res.status(200).json({
      success: true,
      teams
    });
  } catch (error) {
    console.error("Error searching teams:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search teams",
      error: error.message
    });
  }
};



