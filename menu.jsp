<menuBar id="menuBar1">
<table width="100%" cellspacing="0" cellpadding="0" border="0" id="mainMenu" class="toppad">
   <tr align="center">
    <td>
        <menu toolbar="file" activate="onMouseOver"/>
        <dashboardMenus/>
		    <menu toolbar="personalization"     />
		    <menu toolbar="calendarAndChart"   itype="http://www.hudsonfog.com/voc/model/recurrence/ScheduledItem,http://www.hudsonfog.com/voc/model/company/Contact" />
		    <print image="icons/printerIcon.gif"/>
		    <saveInExcel allow="owner" image="images/excel.gif"/>
		    <chat                               />
		    <showHideWindows                    />
        <include name="searchText.jsp"/>
        <a href="#"><logo src="icons/logo.gif" srcLarge="icons/logo-large.gif" /></a>
        <img allow="admin" id="menuLink_codeBehindThePage" title="View Source&lt;br&gt; This page is based solely on the declarative code that you can inspect by clicking on the links in popup" class="cursor" src="icons/codeBehindThePage.gif" onclick="menuOnClick(event)" align="middle" />
    </td>
  </tr>
  <tr>
    <td class="line" valign="middle"><resourceTypeLabel/></td>
  </tr>
  <tr bgcolor="#F1F1F1">
    <td>
	  <table width="100%">
	  <tr>
      <td class="welcome" valign="top">
	      <a href="help.html"> <img src="icons/help.gif" title="Site Help. Describes Operations, Menus, Navigation, Search" border="0" align="absmiddle"/></a>
	      <changePassword/><userLogOff html="user-login.html"/><registerNewUser/><myProfile property="unread" />
	    </td>
	    <td valign="middle" nowrap="nowrap"  align="right">
	      <a href="http://lablz.com"><img src="icons/universalPlatform.gif" align="absmiddle" border="0"/><span  class="poweredBy" style="padding-left: 5px">on Universal</span><span class="poweredBy-b">Platform</span></a>
	    </td>
	  </tr>
	  </table>
  </td>
  </tr>
  <tr>
    <td align="middle"><alphabeticIndex/></td>
  </tr>
</table>
</menuBar>
