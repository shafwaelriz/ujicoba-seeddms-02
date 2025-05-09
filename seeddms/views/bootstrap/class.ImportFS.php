<?php
/**
 * Implementation of ImportFS view
 *
 * @category   DMS
 * @package    SeedDMS
 * @license    GPL 2
 * @version    @version@
 * @author     Uwe Steinmann <uwe@steinmann.cx>
 * @copyright  Copyright (C) 2002-2005 Markus Westphal,
 *             2006-2008 Malcolm Cowe, 2010 Matteo Lucarelli,
 *             2010-2012 Uwe Steinmann
 * @version    Release: @package_version@
 */

/**
 * Include parent class
 */
//require_once("class.Bootstrap.php");

/**
 * Class which outputs the html page for ImportFS view
 *
 * @category   DMS
 * @package    SeedDMS
 * @author     Markus Westphal, Malcolm Cowe, Uwe Steinmann <uwe@steinmann.cx>
 * @copyright  Copyright (C) 2002-2005 Markus Westphal,
 *             2006-2008 Malcolm Cowe, 2010 Matteo Lucarelli,
 *             2010-2012 Uwe Steinmann
 * @version    Release: @package_version@
 */
class SeedDMS_View_ImportFS extends SeedDMS_Theme_Style {

	function js() { /* {{{ */
		header('Content-Type: application/javascript; charset=UTF-8');

//		$this->printFolderChooserJs("form1");
		$this->printDropFolderChooserJs("form1", 1);
	} /* }}} */

	function show() { /* {{{ */
		$dms = $this->params['dms'];
		$user = $this->params['user'];
		$dropfolderdir = $this->params['dropfolderdir'];

		$this->htmlStartPage(getMLText("import_fs"));
		$this->globalNavigation();
		$this->contentStart();
		$this->pageNavigation(getMLText("admin_tools"), "admin_tools");

		$this->contentHeading(getMLText("import_fs"));

		if($dropfolderdir && file_exists($dropfolderdir.'/'.$user->getLogin())) {
			$this->warningMsg(getMLText("import_fs_warning"));
			print "<form class=\"form-horizontal\" action=\"../op/op.ImportFS.php\" name=\"form1\">";
			$this->contentContainerStart();
			$this->formField(getMLText("choose_target_folder"), $this->getFolderChooserHtml("form1", M_READWRITE));
			$this->formField(
				getMLText("dropfolder_folder"),
				$this->getDropFolderChooserHtml("form1", "", 1, 1)
			);
			$this->formField(
				getMLText("dropfolder_metadata"),
				$this->getDropFolderChooserHtml("form2", "", 0, 1)
			);
			$this->formField(
				getMLText("createSubFolderForImportedFiles"),
				array(
					'element'=>'input',
					'type'=>'checkbox',
					'name'=>'createfolder',
					'value'=>'1',
				), array(
					'help'=>getMLText('createSubFolderForImportedFiles_desc'),
				)
			);
			$this->formField(
				getMLText("removeFolderFromDropFolder"),
				array(
					'element'=>'input',
					'type'=>'checkbox',
					'name'=>'remove',
					'value'=>'1'
				), array(
					'help'=>getMLText('removeFolderFromDropFolder_desc'),
				)
			);
			$this->formField(
				getMLText("setDateFromFile"),
				array(
					'element'=>'input',
					'type'=>'checkbox',
					'name'=>'setfiledate',
					'value'=>'1'
				), array(
					'help'=>getMLText('setDateFromFile_desc'),
				)
			);
			$this->formField(
				getMLText("setDateFromFolder"),
				array(
					'element'=>'input',
					'type'=>'checkbox',
					'name'=>'setfolderdate',
					'value'=>'1'
				), array(
					'help'=>getMLText('setDateFromFolder_desc'),
				)
			);
			$this->contentContainerEnd();
			$this->formSubmit("<i class=\"fa fa-save\"></i> ".getMLText('import'));
			print "</form>\n";
		} else {
			$this->warningMsg(getMLText("dropfolderdir_missing"));
		}

		$this->contentEnd();
		$this->htmlEndPage();
	} /* }}} */
}

