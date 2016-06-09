using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.ModelBinding;
using ActionFilterAttribute = System.Web.Http.Filters.ActionFilterAttribute;

namespace CustomWidgetCL.Controllers
{
    public class DateController : ApiController
    {
        [System.Web.Http.HttpGet]
        [Localization]
        public IHttpActionResult FormatDate([FromUri]MyClass obj)
        {
            return Ok(obj);
        }
        [System.Web.Http.HttpPost]
        public IHttpActionResult Get([ModelBinder(typeof(ModelBinderCustom<Child>))]Parent parent)
        {
            return Json(parent);
        }
        //
        public IHttpActionResult Put(Parent parent)
        {
            return Json(parent);
        }
        [System.Web.Http.Authorize]
        public IHttpActionResult Delete()
        {
            return Json("Authorize");
        }
    }
    public class Parent
    {
        public int Id { get; set; }
        public Child Child { get; set; }
        public ConsoleColor Color { get; set; }
    }
    [FromUri]
    public class Child
    {
        public string Name { get; set; }
        public DateTime Date { get; set; }
    }

    class LocalizationAttribute : ActionFilterAttribute
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
