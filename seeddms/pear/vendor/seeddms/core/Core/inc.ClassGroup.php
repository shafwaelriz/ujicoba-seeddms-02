<?php
declare(strict_types=1);

/**
 * Implementation of the group object in the document management system
 *
 * @category   DMS
 * @package    SeedDMS_Core
 * @license    GPL 2
 * @version    @version@
 * @author     Uwe Steinmann <uwe@steinmann.cx>
 * @copyright  Copyright (C) 2002-2005 Markus Westphal, 2006-2008 Malcolm Cowe,
 *             2010-2024 Uwe Steinmann
 * @version    Release: @package_version@
 */

/**
 * Class to represent a user group in the document management system
 *
 * @category   DMS
 * @package    SeedDMS_Core
 * @author     Markus Westphal, Malcolm Cowe, Uwe Steinmann <uwe@steinmann.cx>
 * @copyright  Copyright (C) 2002-2005 Markus Westphal, 2006-2008 Malcolm Cowe,
 *             2010-2024 Uwe Steinmann
 * @version    Release: @package_version@
 */
class SeedDMS_Core_Group { /* {{{ */
	/**
	 * The id of the user group
	 *
	 * @var integer
	 */
	protected $_id;

	/**
	 * The name of the user group
	 *
	 * @var string
	 */
	protected $_name;

	/**
	 * @var SeedDMS_Core_User[]
	 */
	protected $_users;

	/**
	 * The comment of the user group
	 *
	 * @var string
	 */
	protected $_comment;

	/**
	 * Back reference to DMS this user group belongs to
	 *
	 * @var SeedDMS_Core_DMS
	 */
	protected $_dms;

	public function __construct($id, $name, $comment) { /* {{{ */
		$this->_id = $id;
		$this->_name = $name;
		$this->_comment = $comment;
		$this->_dms = null;
	} /* }}} */

	/**
	 * Return an instance of a group object
	 *
	 * @param string|integer $id Id, name of group, depending
	 * on the 3rd parameter.
	 * @param SeedDMS_Core_DMS $dms instance of dms
	 * @param string $by search by group name if set to 'name'.
	 * Search by Id of group if left empty.
	 * @return SeedDMS_Core_Group|bool instance of class SeedDMS_Core_Group if group was
	 * found, null if group was not found, false in case of error
	 */
	public static function getInstance($id, $dms, $by = '') { /* {{{ */
		$db = $dms->getDB();

		switch ($by) {
			case 'name':
				$queryStr = "SELECT * FROM `tblGroups` WHERE `name` = ".$db->qstr($id);
				break;
			default:
				$queryStr = "SELECT * FROM `tblGroups` WHERE `id` = " . (int) $id;
		}

		$resArr = $db->getResultArray($queryStr);
		if (is_bool($resArr) && $resArr == false)
			return false;
		elseif (count($resArr) != 1) //wenn, dann wohl eher 0 als > 1 ;-)
			return null;

		$resArr = $resArr[0];

		$group = new self($resArr["id"], $resArr["name"], $resArr["comment"]);
		$group->setDMS($dms);
		return $group;
	} /* }}} */

	/**
	 * Get all groups
	 *
	 * @param $orderby set to `name` for odering by name
	 * @param SeedDMS_Core_DMS $dms
	 * @return SeedDMS_Core_Group[]|bool list of groups or false in case of an error
	 */
	public static function getAllInstances($orderby, $dms) { /* {{{ */
		$db = $dms->getDB();

		switch ($orderby) {
			case 'name':
				$queryStr = "SELECT * FROM `tblGroups` ORDER BY `name`";
				break;
			default:
				$queryStr = "SELECT * FROM `tblGroups` order by `id`";
		}
		$resArr = $db->getResultArray($queryStr);

		if (is_bool($resArr) && $resArr == false)
			return false;

		$groups = array();
		for ($i = 0; $i < count($resArr); $i++) {
			$group = new self($resArr[$i]["id"], $resArr[$i]["name"], $resArr[$i]["comment"]);
			$group->setDMS($dms);
			$groups[$i] = $group;
		}

		return $groups;
	} /* }}} */

	/**
	 * Cast to string
	 *
	 * @return string
	 */
	public function __toString() { /* {{{ */
		return $this->_name;
	} /* }}} */

	/**
	 * Check if this object is of type 'group'.
	 *
	 * @param string $type type of object
	 */
	public function isType($type) { /* {{{ */
		return $type == 'group';
	} /* }}} */

	/**
	 * @param SeedDMS_Core_DMS $dms
	 */
	public function setDMS($dms) { /* {{{ */
		$this->_dms = $dms;
	} /* }}} */

	/**
	 * @return SeedDMS_Core_DMS $dms
	 */
	public function getDMS() {
		return $this->_dms;
	}

	/**
	 * Return internal id of group
	 *
	 * @return int
	 */
	public function getID() { return $this->_id; }

	/**
	 * Return name of group
	 *
	 * @return string
	 */
	public function getName() { return $this->_name; }

	/**
	 * Set new name of group
	 *
	 * @param $newName new name
	 * @return bool true on success, otherwise false
	 */
	public function setName($newName) { /* {{{ */
		$newName = trim($newName);
		if (!$newName)
			return false;

		$db = $this->_dms->getDB();

		$queryStr = "UPDATE `tblGroups` SET `name` = ".$db->qstr($newName)." WHERE `id` = " . $this->_id;
		if (!$db->getResult($queryStr))
			return false;

		$this->_name = $newName;
		return true;
	} /* }}} */

	/**
	 * Return comment of group
	 *
	 * @return string
	 */
	public function getComment() { return $this->_comment; }

	/**
	 * Set new comment of group
	 *
	 * @param $newComment
	 * @return bool true on success, otherwise false
	 */
	public function setComment($newComment) { /* {{{ */
		$db = $this->_dms->getDB();

		$queryStr = "UPDATE `tblGroups` SET `comment` = ".$db->qstr($newComment)." WHERE `id` = " . $this->_id;
		if (!$db->getResult($queryStr))
			return false;

		$this->_comment = $newComment;
		return true;
	} /* }}} */

	/**
	 * Get all users which are members of the group
	 *
	 * @return SeedDMS_Core_User[]|bool
	 */
	public function getUsers() { /* {{{ */
		$db = $this->_dms->getDB();

		if (!isset($this->_users)) {
			$queryStr = "SELECT `tblUsers`.* FROM `tblUsers` ".
				"LEFT JOIN `tblGroupMembers` ON `tblGroupMembers`.`userID`=`tblUsers`.`id` ".
				"WHERE `tblGroupMembers`.`groupID` = '". $this->_id ."'";
			$resArr = $db->getResultArray($queryStr);
			if (is_bool($resArr) && $resArr == false)
				return false;

			$this->_users = array();

			$classnamerole = $this->_dms->getClassname('role');
			$classname = $this->_dms->getClassname('user');
			foreach ($resArr as $row) {
				/** @var SeedDMS_Core_User $user */
				$role = $classnamerole::getInstance($row['role'], $this->_dms);
				$user = new $classname($row["id"], $row["login"], $row["pwd"], $row["fullName"], $row["email"], $row["language"], $row["theme"], $row["comment"], $role, $row['hidden']);
				$user->setDMS($this->_dms);
				array_push($this->_users, $user);
			}
		}
		return $this->_users;
	} /* }}} */

	/**
	 * Get all users which are managers of the group
	 *
	 * @return SeedDMS_Core_User[]|bool
	 */
	public function getManagers() { /* {{{ */
		$db = $this->_dms->getDB();

		$queryStr = "SELECT `tblUsers`.* FROM `tblUsers` ".
			"LEFT JOIN `tblGroupMembers` ON `tblGroupMembers`.`userID`=`tblUsers`.`id` ".
			"WHERE `tblGroupMembers`.`groupID` = '". $this->_id ."' AND `tblGroupMembers`.`manager` = 1";
		$resArr = $db->getResultArray($queryStr);
		if (is_bool($resArr) && $resArr == false)
			return false;

		$managers = array();

		$classnamerole = $this->_dms->getClassname('role');
		$classname = $this->_dms->getClassname('user');
		foreach ($resArr as $row) {
			/** @var SeedDMS_Core_User $user */
			$role = $classnamerole::getInstance($row['role'], $this->_dms);
			$user = new $classname($row["id"], $row["login"], $row["pwd"], $row["fullName"], $row["email"], $row["language"], $row["theme"], $row["comment"], $role, $row['hidden']);
			$user->setDMS($this->_dms);
			array_push($managers, $user);
		}
		return $managers;
	} /* }}} */

	/**
	 * Add user as member
	 *
	 * @param SeedDMS_Core_User $user
	 * @param bool $asManager if set, user will be a manager of the group
	 * @return bool
	 */
	public function addUser($user, $asManager = false) { /* {{{ */
		$db = $this->_dms->getDB();

		$queryStr = "INSERT INTO `tblGroupMembers` (`groupID`, `userID`, `manager`) VALUES (".$this->_id.", ".$user->getID(). ", " . ($asManager?"1":"0") ." )";
		$res = $db->getResult($queryStr);

		if (!$res) return false;

		unset($this->_users);
		return true;
	} /* }}} */

	/**
	 * Remove users as a member of the group
	 *
	 * @param SeedDMS_Core_User $user
	 * @return bool
	 */
	public function removeUser($user) { /* {{{ */
		$db = $this->_dms->getDB();

		$queryStr = "DELETE FROM `tblGroupMembers` WHERE `groupID` = ".$this->_id." AND `userID` = ".$user->getID();
		$res = $db->getResult($queryStr);

		if (!$res) return false;
		unset($this->_users);
		return true;
	} /* }}} */

	/**
	 * Check if user is member of group
	 *
	 * @param SeedDMS_Core_User $user user to be checked
	 * @param boolean $asManager also check whether user is manager of group if
	 * set to true, otherwise does not care about manager status
	 * @return boolean true if user is member, otherwise false
	 */
	public function isMember($user, $asManager = false) { /* {{{ */
		if (isset($this->_users)&&!$asManager) {
			foreach ($this->_users as $usr)
				if ($usr->getID() == $user->getID())
					return true;
			return false;
		}

		$db = $this->_dms->getDB();
		$queryStr = "SELECT * FROM `tblGroupMembers` WHERE `groupID` = " . $this->_id . " AND `userID` = " . $user->getID();
		if ($asManager)
			$queryStr .= " AND `manager` = 1";

		$resArr = $db->getResultArray($queryStr);

		if (is_bool($resArr) && $resArr == false) return false;
		if (count($resArr) != 1) return false;

		return true;
	} /* }}} */

	/**
	 * Toggle manager status of user
	 *
	 * @param SeedDMS_Core_User $user
	 * @return boolean true if operation was successful, otherwise false
	 */
	public function toggleManager($user) { /* {{{ */
		$db = $this->_dms->getDB();

		if (!$this->isMember($user)) return false;

		if ($this->isMember($user, true)) $queryStr = "UPDATE `tblGroupMembers` SET `manager` = 0 WHERE `groupID` = ".$this->_id." AND `userID` = ".$user->getID();
		else $queryStr = "UPDATE `tblGroupMembers` SET `manager` = 1 WHERE `groupID` = ".$this->_id." AND `userID` = ".$user->getID();

		if (!$db->getResult($queryStr)) return false;
		return true;
	} /* }}} */

	/**
	 * Delete user group
	 *
	 * This method deletes the user group and all its references, like access
	 * control lists, notifications, etc.
	 *
	 * @param SeedDMS_Core_User $user the user doing the removal (needed for entry in
	 *        review log.
	 * @return boolean true on success or false in case of an error
	 */
	public function remove($user) { /* {{{ */
		$db = $this->_dms->getDB();

		$db->startTransaction();

		$queryStr = "DELETE FROM `tblGroupMembers` WHERE `groupID` = " . $this->_id;
		if (!$db->getResult($queryStr)) {
			$db->rollbackTransaction();
			return false;
		}
		$queryStr = "DELETE FROM `tblACLs` WHERE `groupID` = " . $this->_id;
		if (!$db->getResult($queryStr)) {
			$db->rollbackTransaction();
			return false;
		}
		$queryStr = "DELETE FROM `tblNotify` WHERE `groupID` = " . $this->_id;
		if (!$db->getResult($queryStr)) {
			$db->rollbackTransaction();
			return false;
		}
		$queryStr = "DELETE FROM `tblMandatoryReviewers` WHERE `reviewerGroupID` = " . $this->_id;
		if (!$db->getResult($queryStr)) {
			$db->rollbackTransaction();
			return false;
		}
		$queryStr = "DELETE FROM `tblMandatoryApprovers` WHERE `approverGroupID` = " . $this->_id;
		if (!$db->getResult($queryStr)) {
			$db->rollbackTransaction();
			return false;
		}
		$queryStr = "DELETE FROM `tblWorkflowTransitionGroups` WHERE `groupid` = " . $this->_id;
		if (!$db->getResult($queryStr)) {
			$db->rollbackTransaction();
			return false;
		}
		$queryStr = "DELETE FROM `tblGroups` WHERE `id` = " . $this->_id;
		if (!$db->getResult($queryStr)) {
			$db->rollbackTransaction();
			return false;
		}

		// TODO : update document status if reviewer/approver has been deleted


		$reviewStatus = $this->getReviewStatus();
		foreach ($reviewStatus as $r) {
			$queryStr = "INSERT INTO `tblDocumentReviewLog` (`reviewID`, `status`, `comment`, `date`, `userID`) ".
				"VALUES ('". $r["reviewID"] ."', '-2', 'Review group removed from process', ".$db->getCurrentDatetime().", '". $user->getID() ."')";
			$res = $db->getResult($queryStr);
			if (!$res) {
				$db->rollbackTransaction();
				return false;
			}
		}

		$approvalStatus = $this->getApprovalStatus();
		foreach ($approvalStatus as $a) {
			$queryStr = "INSERT INTO `tblDocumentApproveLog` (`approveID`, `status`, `comment`, `date`, `userID`) ".
				"VALUES ('". $a["approveID"] ."', '-2', 'Approval group removed from process', ".$db->getCurrentDatetime().", '". $user->getID() ."')";
			$res = $db->getResult($queryStr);
			if (!$res) {
				$db->rollbackTransaction();
				return false;
			}
		}

		$receiptStatus = $this->getReceiptStatus();
		foreach ($receiptStatus as $r) {
			$queryStr = "INSERT INTO `tblDocumentReceiptLog` (`receiptID`, `status`, `comment`, `date`, `userID`) ".
				"VALUES ('". $r["receiptID"] ."', '-2', 'Recipients group removed from process', ".$db->getCurrentDatetime().", '". $user->getID() ."')";
			$res=$db->getResult($queryStr);
			if(!$res) {
				$db->rollbackTransaction();
				return false;
			}
		}

		$revisionStatus = $this->getRevisionStatus();
		foreach ($revisionStatus as $r) {
			$queryStr = "INSERT INTO `tblDocumentRevisionLog` (`revisionID`, `status`, `comment`, `date`, `userID`) ".
				"VALUES ('". $r["revisionID"] ."', '-2', 'Revisors group removed from process', ".$db->getCurrentDatetime().", '". $user->getID() ."')";
			$res=$db->getResult($queryStr);
			if(!$res) {
				$db->rollbackTransaction();
				return false;
			}
		}

		$db->commitTransaction();

		return true;
	} /* }}} */

	public function getReviewStatus($documentID = null, $version = null) { /* {{{ */
		$db = $this->_dms->getDB();

		if (!$db->createTemporaryTable("ttreviewid")) {
			return false;
		}

		$status = array();

		// See if the group is assigned as a reviewer.
		$queryStr = "SELECT `tblDocumentReviewers`.*, `tblDocumentReviewLog`.`status`, ".
			"`tblDocumentReviewLog`.`comment`, `tblDocumentReviewLog`.`date`, ".
			"`tblDocumentReviewLog`.`userID` ".
			"FROM `tblDocumentReviewers` ".
			"LEFT JOIN `tblDocumentReviewLog` USING (`reviewID`) ".
			"LEFT JOIN `ttreviewid` on `ttreviewid`.`maxLogID` = `tblDocumentReviewLog`.`reviewLogID` ".
			"WHERE `ttreviewid`.`maxLogID`=`tblDocumentReviewLog`.`reviewLogID` ".
			($documentID==null ? "" : "AND `tblDocumentReviewers`.`documentID` = '". (int) $documentID ."' ").
			($version == null ? "" : "AND `tblDocumentReviewers`.`version` = '". (int) $version ."' ").
			"AND `tblDocumentReviewers`.`type`='1' ".
			"AND `tblDocumentReviewers`.`required`='". $this->_id ."' ".
			"ORDER BY `tblDocumentReviewLog`.`reviewLogID` DESC";
		$resArr = $db->getResultArray($queryStr);
		if (is_bool($resArr) && $resArr == false)
			return false;
		if (count($resArr)>0) {
			foreach ($resArr as $res)
				$status[] = $res;
		}
		return $status;
	} /* }}} */

	public function getApprovalStatus($documentID = null, $version = null) { /* {{{ */
		$db = $this->_dms->getDB();

		if (!$db->createTemporaryTable("ttapproveid")) {
			return false;
		}

		$status = array();

		// See if the group is assigned as an approver.
		$queryStr = "SELECT `tblDocumentApprovers`.*, `tblDocumentApproveLog`.`status`, ".
			"`tblDocumentApproveLog`.`comment`, `tblDocumentApproveLog`.`date`, ".
			"`tblDocumentApproveLog`.`userID` ".
			"FROM `tblDocumentApprovers` ".
			"LEFT JOIN `tblDocumentApproveLog` USING (`approveID`) ".
			"LEFT JOIN `ttapproveid` on `ttapproveid`.`maxLogID` = `tblDocumentApproveLog`.`approveLogID` ".
			"WHERE `ttapproveid`.`maxLogID`=`tblDocumentApproveLog`.`approveLogID` ".
			($documentID==null ? "" : "AND `tblDocumentApprovers`.`documentID` = '". (int) $documentID ."' ").
			($version == null ? "" : "AND `tblDocumentApprovers`.`version` = '". (int) $version ."' ").
			"AND `tblDocumentApprovers`.`type`='1' ".
			"AND `tblDocumentApprovers`.`required`='". $this->_id ."' ";
		$resArr = $db->getResultArray($queryStr);
		if (is_bool($resArr) && $resArr == false)
			return false;
		if (count($resArr)>0) {
			foreach ($resArr as $res)
				$status[] = $res;
		}

		return $status;
	} /* }}} */

	function getReceiptStatus($documentID=null, $version=null) { /* {{{ */
		$db = $this->_dms->getDB();

		$status = array();

		// See if the group is assigned as a recipient.
		$queryStr = "SELECT `tblDocumentRecipients`.*, `tblDocumentReceiptLog`.`status`, ".
			"`tblDocumentReceiptLog`.`comment`, `tblDocumentReceiptLog`.`date`, ".
			"`tblDocumentReceiptLog`.`userID` ".
			"FROM `tblDocumentRecipients` ".
			"LEFT JOIN `tblDocumentReceiptLog` USING (`receiptID`) ".
			"WHERE `tblDocumentRecipients`.`type`='1' ".
			($documentID==null ? "" : "AND `tblDocumentRecipients`.`documentID` = '". (int) $documentID ."' ").
			($version==null ? "" : "AND `tblDocumentRecipients`.`version` = '". (int) $version ."' ").
			"AND `tblDocumentRecipients`.`required`='". $this->_id ."' ";
		$resArr = $db->getResultArray($queryStr);
		if (is_bool($resArr) && $resArr == false)
			return false;
		if (count($resArr)>0) {
			foreach ($resArr as $res) {
				if(isset($status[$res['documentID']])) {
					if($status[$res['documentID']]['date'] < $res['date']) {
						$status[$res['documentID']] = $res;
					}
				} else {
					$status[$res['documentID']] = $res;
				}
			}
		}
		return $status;
	} /* }}} */

	function getRevisionStatus($documentID=null, $version=null) { /* {{{ */
		$db = $this->_dms->getDB();

		$status = array();

		if (!$db->createTemporaryTable("ttcontentid")) {
			return false;
		}
		// See if the group is assigned as a revisor.
		$queryStr = "SELECT `tblDocumentRevisors`.*, `tblDocumentRevisionLog`.`status`, ".
			"`tblDocumentRevisionLog`.`comment`, `tblDocumentRevisionLog`.`date`, ".
			"`tblDocumentRevisionLog`.`userID` ".
			"FROM `tblDocumentRevisors` ".
			"LEFT JOIN `tblDocumentRevisionLog` USING (`revisionID`) ".
			"LEFT JOIN `ttcontentid` ON `ttcontentid`.`maxVersion` = `tblDocumentRevisors`.`version` AND `ttcontentid`.`document` = `tblDocumentRevisors`.`documentID` ".
			"WHERE `tblDocumentRevisors`.`type`='1' ".
			($documentID==null ? "" : "AND `tblDocumentRevisors`.`documentID` = '". (int) $documentID ."' ").
			($version==null ? "" : "AND `tblDocumentRevisors`.`version` = '". (int) $version ."' ").
			($documentID==null && $version==null ? "AND `ttcontentid`.`maxVersion` = `tblDocumentRevisors`.`version` " : "").
			"AND `tblDocumentRevisors`.`required`='". $this->_id ."' ".
			"ORDER BY `tblDocumentRevisionLog`.`revisionLogID` DESC";
		$resArr = $db->getResultArray($queryStr);
		if ($resArr === false)
			return false;
		if (count($resArr)>0) {
			foreach ($resArr as $res) {
				if($res['date']) {
					if(isset($status[$res['documentID']])) {
						if($status[$res['documentID']]['date'] < $res['date']) {
							$status[$res['documentID']] = $res;
						}
					} else {
						$status[$res['documentID']] = $res;
					}
				}
			}
		}
		return $status;
	} /* }}} */

	/**
	 * Get a list of documents with a workflow
	 *
	 * @param int $documentID optional document id for which to retrieve the
	 *        reviews
	 * @param int $version optional version of the document
	 * @return bool|array list of all workflows
	 */
	public function getWorkflowStatus($documentID = null, $version = null) { /* {{{ */
		$db = $this->_dms->getDB();

		$queryStr = 'select distinct d.*, c.`groupid` from `tblWorkflowTransitions` a left join `tblWorkflows` b on a.`workflow`=b.`id` left join `tblWorkflowTransitionGroups` c on a.`id`=c.`transition` left join `tblWorkflowDocumentContent` d on b.`id`=d.`workflow` where d.`document` is not null and a.`state`=d.`state` and c.`groupid`='.$this->_id;
		if ($documentID) {
			$queryStr .= ' AND d.`document`='.(int) $documentID;
			if ($version)
				$queryStr .= ' AND d.`version`='.(int) $version;
		}
		$resArr = $db->getResultArray($queryStr);
		if (is_bool($resArr) && $resArr == false)
			return false;
		$result = array();
		if (count($resArr)>0) {
			foreach ($resArr as $res) {
				$result[] = $res;
			}
		}
		return $result;
	} /* }}} */

	/**
	 * Get all notifications of group
	 *
	 * @param integer $type type of item (T_DOCUMENT or T_FOLDER)
	 * @return SeedDMS_Core_Notification[]|bool array of notifications
	 */
	public function getNotifications($type = 0) { /* {{{ */
		$db = $this->_dms->getDB();
		$queryStr = "SELECT `tblNotify`.* FROM `tblNotify` ".
		 "WHERE `tblNotify`.`groupID` = ". $this->_id;
		if ($type) {
			$queryStr .= " AND `tblNotify`.`targetType` = ". (int) $type;
		}

		$resArr = $db->getResultArray($queryStr);
		if (is_bool($resArr) && !$resArr)
			return false;

		$notifications = array();
		foreach ($resArr as $row) {
			$not = new SeedDMS_Core_Notification($row["target"], $row["targetType"], $row["userID"], $row["groupID"]);
			$not->setDMS($this->_dms);
			array_push($notifications, $not);
		}

		return $notifications;
	} /* }}} */

} /* }}} */
