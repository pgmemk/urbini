<html>
<include name="include/commonHeader" />
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <colgroup>
    <col width="10%" /> 
    <col width="80%" />
    <col width="10%" />
  </colgroup>
<tr>
  <td width="10%"></td>
  <td width="80%"></td>
  <td width="10%"></td>
</tr>
<tr>
  <td valign="top" width="10%">
    <include name="include/commonLeft" />
  </td>
  <!--td align="right"><userLogOff html="user-login.html"/></td-->
  <td valign="top" align="middle">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
      <td valign="top" width="80%"><span class="xs"><language/>|<print image="images/printerIcon.gif"/></span></td>
      <td valign="top" align="right" width="20%"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr><td valign="top">  
    <!--div align="left"><siteHistory/></div-->
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <div align="right"><measurement/></div>
      <readOnlySiteInfo />
      <addNewResource html="mkResource.html" /> 
      <showSetProperties />
    </form>
  </td>
  <td valign="top" align="left" width="10%" bgcolor="eeeeee">
    <include name="searchText.jsp" />
    <form name="tablePropertyList" method="POST" action="FormRedirect">
      <tablePropertyList />
      <br></br>
      <center><input type="submit" name="submit" value="  Locate  "></input></center>
      <input type="hidden" name="action" value="searchLocal"></input>
      <br></br>
    </form>
  </td>
  </tr></table>
</td></tr></table>
<br />
<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
<include name="include/commonFooter" />
</html>

