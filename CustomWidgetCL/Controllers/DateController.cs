using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace CustomWidgetCL.Controllers
{
    public class DateController : ApiController
    {
        [HttpGet]
        [Localization]
        public IHttpActionResult FormatDate([FromUri]MyClass obj)
        {
            return Ok(obj);
        }

    }

    class LocalizationAttribute:ActionFilterAttribute
    {
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            Thread.CurrentThread.CurrentCulture = new CultureInfo("ar-OM");
            Thread.CurrentThread.CurrentUICulture = new CultureInfo("ar-OM");

            base.OnActionExecuting(actionContext);
        }
    }
    public class MyClass
    {
        public DateTime? StartCreatedDate { get; set; }
        public DateTime? EndCreatedDate { get; set; }

    }
}
