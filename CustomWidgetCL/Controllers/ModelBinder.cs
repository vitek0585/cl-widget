using System;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Web.Http.Controllers;
using System.Web.Http.ModelBinding;

namespace CustomWidgetCL.Controllers
{
    public class ModelBinderCustom<TFilter> : IModelBinder
    {

        public bool BindModel(HttpActionContext actionContext, ModelBindingContext bindingContext)
        {
            var modelType = bindingContext.ModelType;
            var properties = modelType.GetProperties(BindingFlags.IgnoreCase | BindingFlags.Instance |
                                    BindingFlags.Public);
            var query = actionContext.Request.RequestUri.ParseQueryString();
            var insance = Activator.CreateInstance(modelType);
            var filterInsance = Activator.CreateInstance<TFilter>();

            foreach (string keyValue in query)
            {
                var prop = modelType.GetProperty(keyValue, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                var propFilter = typeof(TFilter).GetProperty(keyValue, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);

                if (propFilter != null && propFilter.PropertyType.IsEnum)
                    propFilter.SetValue(filterInsance, Enum.Parse(propFilter.PropertyType, query[keyValue], true));
                else
                    propFilter?.SetValue(filterInsance, Convert.ChangeType(query[keyValue], propFilter.PropertyType));

                if (prop != null && prop.PropertyType.IsEnum)
                    prop.SetValue(insance, Enum.Parse(prop.PropertyType, query[keyValue], true));
                else
                    prop?.SetValue(insance, Convert.ChangeType(query[keyValue], prop.PropertyType));
            }
            var filter = properties.FirstOrDefault(prop => prop.PropertyType == typeof(TFilter));
            filter?.SetValue(insance, filterInsance);
            bindingContext.Model = insance;
            return true;
        }
    }
}