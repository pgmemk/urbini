<html>
<script language="JavaScript" src="calendar/calendar1.html"></script>
<siteTitle />

<pda nonPda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="95%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <colgroup>
      <col width="90%" /> 
      <col width="10%" />
    </colgroup>
    <tr valign="top">
      <td valign="top" width="90%"><span class="xs"><language/> <print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/></span><pdaToPc image="images/pda.gif"/></td>
      <td valign="top" align="right" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <parallelResourceList />
      <div align="right"><measurement/></div>
      <addNewResource html="mkResource.html"/> 
      <createResources/>
      <showSetProperties />
    </form>
    </td>
    <td valign="top" align="left" bgcolor="eeeeee">

    <include name="searchText.jsp" />
    
    <form name="rightPanelPropertySheet" method="POST" action="remoteSearchResults.html">
      <table border="1" cellpadding="3" cellspacing="0"><tr><td align="middle" class="title">
        <input type="submit" name="submit" class="button1" value="Filter"></input>
        <input type="submit" name="clear" class="button1" value="Clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
        <input type="submit" name="submit" class="button1" value="Filter"></input>
        <input type="submit" name="clear" class="button1" value="Clear"></input>
        <input type="hidden" name="action" value="searchParallel"></input>
        <input type="hidden" name="site" value=""></input>
      </td></tr></table>   
    </form>
  </td>
</tr></table>
</td></tr></table>
</pda>
<pda pda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="95%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
      <td valign="top">
        <img src="icons/icon.gif" width="16" height="16" align="middle"/>
        <A title="Manufacturer" href="javascript://" onClick="menuOpenClose('textdiv')" ><IMG src="images/shortcuts.gif"  width="16" height="16" align="middle" border="0"/></A>
        <A title="Search"    href="javascript://" onClick="menuOpenClose('textdiv1')"><IMG src="images/search.gif"  width="16" height="16" align="middle" border="0"/></A>
        <A title="Filter"    href="javascript://" onClick="menuOpenClose('textdiv2')"><IMG src="images/filter.gif"  width="16" height="16" align="middle" border="0"/></A>
        <A title="Email"     href="javascript://" onClick="menuOpenClose('textdiv3')"><IMG src="images/email.gif"  width="16" height="16" align="middle" border="0"/></A>
        <A title="Schedule"  href="javascript://" onClick="menuOpenClose('textdiv4')"><IMG src="images/calendar.gif"  width="16" height="16" align="middle" border="0"/></A>
        <A title="Languages"  href="javascript://" onClick="menuOpenClose('language')"><IMG src="images/globus.gif" align="middle" border="0"/></A>
        <A title="Warehouses" href="javascript://" onClick="menuOpenClose('warehousesDiv')"><IMG src="icons/warehouse.gif" align="middle" border="0"/></A>
        <A title="Printing"   href="javascript://" onClick="menuOpenClose('printingDiv')"><IMG src="icons/newspaper.gif" align="middle" border="0"/></A>
        <A title="Vessels"   href="javascript://" onClick="menuOpenClose('vesselsDiv')"><IMG src="icons/vessel.gif" align="middle" border="0"/></A>
        <A title="Wagons"    href="javascript://" onClick="menuOpenClose('wagonsDiv')"><IMG src="icons/wagon.gif" align="middle" border="0"/></A>
        <A title="Trains"    href="javascript://" onClick="menuOpenClose('trainsDiv')"><IMG src="icons/train.gif" align="middle" border="0"/></A>
        <A title="Trucks"    href="javascript://" onClick="menuOpenClose('trucksDiv')"><IMG src="icons/truck.gif" align="middle" border="0"/></A>
        <A title="Support"    href="javascript://" onClick="menuOpenClose('supportDiv')"><IMG src="images/alert.gif" align="middle" border="0"/></A>

        <span class="xs"><language/><print image="images/printerIcon.gif"/> <saveInExcel allow="owner" image="images/excel.gif"/></span><pdaToPc image="images/pda.gif"/><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <parallelResourceList />
      <div align="right"><measurement/></div>
      <addNewResource html="mkResource.html"/> 
      <showSetProperties />
    </form>
  </td></tr></table>
 </td></tr></table>   

<br />
<div>
<div>
  <div id="textdiv2" class="popMenu">
  <div class="popMenuTitle" pda="T">
    <table width="135" cellpadding="2">
      <tr>
        <td><b><font color="FFFFFF">Filter</font></b></td>
        <td align="right"><a title="Close" href="javascript://" onClick="menuOpenClose('textdiv2')"><IMG alt="Click here to close" src="images/button_popup_close.gif" border="0"/></a></td>
      </tr>
    </table>
  </div>
<table border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top"><br/><include name="searchText.jsp" /></td>
</tr>
<tr><td>    
    
    <form name="rightPanelPropertySheet" method="POST" action="remoteSearchResults.html">
      <table border="1" cellpadding="3" cellspacing="0"><tr><td align="middle" class="title">
      <input type="submit" name="submit" class="button1" value="Filter"></input>
      <input type="submit" name="clear" class="button1" value="Clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
      <input type="submit" name="submit" class="button1" value="Filter"></input>
      <input type="submit" name="clear" class="button1" value="Clear"></input>
      <input type="hidden" name="action" value="searchParallel"></input>
      <input type="hidden" name="site" value=""></input>
      </td></tr></table>   
    </form>
  </td>
</tr></table>
</td></tr></table>
</div>
</div>
</pda>
<br />
<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</html>

